-- ticket:             DEMOS-2621
-- author:             Dustin Horning
-- data_owner:         Stephanie Hauf
-- environments:       dev, test, impl, prod
-- expected_rows:      0
-- source:             PMDA migration side effect: submitted deliverables entered as Past Due
-- runner:             demosctl
-- requires_migration: 20261113132100_add_budget_neutrality_reporting_tables
-- reverse:            20261123_DEMOS-2621_revert_deliverable_submitted_status_fix.sql
--
-- Corrects Past Due deliverables that have a document linked to a Submitted Deliverable action.
-- This is a one-time migration cleanup and should not be rerun after the affected rows are resolved.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_deliverable record;
    v_updated_rows int;
    v_total_rows int := 0;
    v_submitter_user_id uuid;
BEGIN
    FOR v_deliverable IN
        SELECT d.id, d.due_date
        FROM demos_app.deliverable AS d
        WHERE d.status_id = 'Past Due'
          AND EXISTS (
              SELECT 1
              FROM demos_app.document AS submitted_document
              WHERE submitted_document.deliverable_id = d.id
                AND submitted_document.deliverable_submission_action_id IS NOT NULL
          )
    LOOP
        UPDATE demos_app.deliverable AS d
        SET status_id = 'Submitted',
            updated_at = CURRENT_TIMESTAMP
        WHERE d.id = v_deliverable.id
          AND d.status_id = 'Past Due';
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

        IF v_updated_rows != 1 THEN
            RAISE EXCEPTION 'Expected exactly 1 Past Due deliverable update for deliverable_id=%, but % rows were affected', v_deliverable.id, v_updated_rows;
        END IF;

        SELECT submitted_action.user_id
        INTO v_submitter_user_id
        FROM demos_app.document AS submitted_document
        JOIN demos_app.deliverable_action AS submitted_action
          ON submitted_action.id = submitted_document.deliverable_submission_action_id
        WHERE submitted_document.deliverable_id = v_deliverable.id
          AND submitted_document.deliverable_submission_action_id IS NOT NULL
        ORDER BY submitted_action.action_timestamp DESC
        LIMIT 1;

        IF v_submitter_user_id IS NULL THEN
            RAISE EXCEPTION 'Expected submitter user for deliverable_id=%', v_deliverable.id;
        END IF;

        INSERT INTO demos_app.deliverable_action (
            id,
            action_timestamp,
            deliverable_id,
            action_type_id,
            old_status_id,
            new_status_id,
            note,
            due_date_change_allowed,
            should_have_note,
            should_have_user_id,
            extension_id_optional,
            old_due_date,
            new_due_date,
            user_id
        )
        VALUES (
            gen_random_uuid(),
            CURRENT_TIMESTAMP,
            v_deliverable.id,
            'Submitted Deliverable',
            'Past Due',
            'Submitted',
            NULL,
            FALSE,
            FALSE,
            TRUE,
            TRUE,
            v_deliverable.due_date,
            v_deliverable.due_date,
            v_submitter_user_id
        );

        v_total_rows := v_total_rows + 1;
    END LOOP;

    INSERT INTO data_fix_result (rows_affected)
    VALUES (v_total_rows);
END
$$;

SELECT
    result.rows_affected,
    (
        SELECT count(*)
        FROM demos_app.deliverable AS d
        WHERE d.status_id = 'Past Due'
          AND EXISTS (
              SELECT 1
              FROM demos_app.document AS submitted_document
              WHERE submitted_document.deliverable_id = d.id
                AND submitted_document.deliverable_submission_action_id IS NOT NULL
          )
    ) AS remaining_incorrect_past_due_rows
FROM pg_temp.data_fix_result AS result;
