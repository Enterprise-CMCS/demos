-- ticket:             DEMOS-2621
-- author:             Dustin Horning
-- data_owner:         Stephanie Hauf
-- environments:       prod
-- expected_rows:      14
-- source:             Reverse of the DEMOS-2621 submitted deliverable status correction
-- runner:             demosctl
-- requires_migration: 20261104004932_add_data_fix_log
-- reverse:            none
-- reverses:           20261124_DEMOS-2621_repair_submitted_deliverable_status.sql
--
-- Restores only deliverables changed by the forward fix and left untouched since its application.
-- If any target has since been updated, the row-count guard aborts the entire reversal for review.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_applied_at timestamptz;
    v_eligible_rows int;
    v_total_rows int;
BEGIN
    SELECT applied_at
    INTO v_applied_at
    FROM demos_app.data_fix_log
    WHERE file_name = '20261124_DEMOS-2621_repair_submitted_deliverable_status.sql';

    IF v_applied_at IS NULL THEN
        RAISE EXCEPTION 'Could not find the applied DEMOS-2621 forward data fix in data_fix_log';
    END IF;

    WITH eligible AS MATERIALIZED (
        SELECT d.id
        FROM demos_app.deliverable AS d
        WHERE d.id IN (
            '24caae00-f70e-4db2-bf33-a5debe808f75',
            '8cde9f59-5dbc-4429-afb3-82ede6f996be',
            '67a59a82-927d-457e-83ea-db1121bcb9ac',
            '8c8c9519-a6ee-4cbd-b06c-f99b1ce09a48',
            'c52cc9c3-e62c-4f6d-ab93-9f2d5cbeed56',
            '64264347-4e51-49ff-a62e-69ebb7adac14',
            'ab7c69f2-6579-4107-9bc2-c0668a3274de',
            '63cd18c5-ed66-4552-95f2-d5e2bb83fdbd',
            '8d470218-f71d-4951-ac2e-21e82a7f5dab',
            '4c91d6e8-9fd1-4bd0-9fcc-ffa847991f10',
            'a5da8164-c2eb-4169-ab2c-924e2be4b38f',
            '5f6e32d9-26b1-458a-b8d3-7a117259ec0a',
            '47ab06d7-c5f1-44db-b7b2-4bd3b2d8e808',
            'd04b46d6-1272-41ae-ac71-974788465ebf'
        )
          AND d.status_id = 'Submitted'
          AND d.updated_at = v_applied_at
          AND EXISTS (
              SELECT 1
              FROM demos_app.deliverable_history AS history
              WHERE history.id = d.id
                AND history.revision_type = 'U'
                AND history.status_id = 'Submitted'
                AND history.modified_at = v_applied_at
          )
          AND NOT EXISTS (
              SELECT 1
              FROM demos_app.deliverable_history AS later_history
              WHERE later_history.id = d.id
                AND later_history.modified_at > v_applied_at
          )
          AND NOT EXISTS (
              SELECT 1
              FROM demos_app.deliverable_action AS later_action
              WHERE later_action.deliverable_id = d.id
                AND later_action.action_timestamp > v_applied_at
          )
    ),
    updated AS (
        UPDATE demos_app.deliverable AS d
        SET status_id = 'Past Due',
            updated_at = CURRENT_TIMESTAMP
        FROM eligible
        WHERE d.id = eligible.id
          AND d.status_id = 'Submitted'
        RETURNING d.id
    )
    SELECT
        (SELECT count(*) FROM eligible),
        (SELECT count(*) FROM updated)
    INTO v_eligible_rows, v_total_rows;

    IF v_total_rows != v_eligible_rows THEN
        RAISE EXCEPTION 'Expected all % eligible deliverables to reverse; reversed %', v_eligible_rows, v_total_rows;
    END IF;

    IF v_total_rows != 14 THEN
        RAISE EXCEPTION 'Expected exactly 14 untouched deliverables to reverse; got %. Review current statuses and history before reverting.', v_total_rows;
    END IF;

    INSERT INTO data_fix_result (rows_affected)
    VALUES (v_total_rows);
END
$$;

SELECT
    result.rows_affected,
    (
        SELECT count(*)
        FROM demos_app.deliverable AS d
        WHERE d.id IN (
            '24caae00-f70e-4db2-bf33-a5debe808f75',
            '8cde9f59-5dbc-4429-afb3-82ede6f996be',
            '67a59a82-927d-457e-83ea-db1121bcb9ac',
            '8c8c9519-a6ee-4cbd-b06c-f99b1ce09a48',
            'c52cc9c3-e62c-4f6d-ab93-9f2d5cbeed56',
            '64264347-4e51-49ff-a62e-69ebb7adac14',
            'ab7c69f2-6579-4107-9bc2-c0668a3274de',
            '63cd18c5-ed66-4552-95f2-d5e2bb83fdbd',
            '8d470218-f71d-4951-ac2e-21e82a7f5dab',
            '4c91d6e8-9fd1-4bd0-9fcc-ffa847991f10',
            'a5da8164-c2eb-4169-ab2c-924e2be4b38f',
            '5f6e32d9-26b1-458a-b8d3-7a117259ec0a',
            '47ab06d7-c5f1-44db-b7b2-4bd3b2d8e808',
            'd04b46d6-1272-41ae-ac71-974788465ebf'
        )
          AND d.status_id = 'Submitted'
    ) AS listed_rows_still_submitted
FROM pg_temp.data_fix_result AS result;
