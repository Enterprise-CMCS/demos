-- ticket:             DEMOS-2621
-- author:             Dustin Horning
-- data_owner:         Stephanie Hauf
-- environments:       prod
-- expected_rows:      14
-- source:             PMDA Requested Resubmission records with prior submission were incorrectly marked Past Due after migration
-- runner:             demosctl
-- requires_migration: 20261104004932_add_data_fix_log
-- reverse:            20261124_DEMOS-2621_revert_repair_submitted_deliverable_status.sql
--
-- Corrects the listed migrated deliverables that remain Past Due despite prior submission evidence.
-- The listed deliverable already at Approved is intentionally left unchanged.
-- No synthetic activity action is inserted; the data-fix ledger and deliverable history trigger audit the correction.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_deliverable record;
    v_rows_affected int;
    v_total_rows int := 0;
BEGIN
    FOR v_deliverable IN
        SELECT d.id
        FROM demos_app.deliverable AS d
        JOIN legacy_pmda_staged.final_demos_app_deliverable AS migrated
          ON migrated.id = d.id
        JOIN legacy_pmda_raw.mdcd_dlvrbl AS pmda
          ON pmda.mdcd_dlvrbl_id = migrated._legacy_mdcd_dlvrbl_id
        JOIN legacy_pmda_raw.mdcd_dlvrbl_stus_rfrnc AS status_ref
          ON status_ref.mdcd_dlvrbl_stus_cd = pmda.mdcd_dlvrbl_crnt_stus_cd
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
            '47ab06d7-c5f1-44db-b7b2-4bd66edef9ce',
            'd04b46d6-1272-41ae-ac71-974788465ebf'
        )
          AND d.status_id = 'Past Due'
          AND status_ref.mdcd_dlvrbl_stus_name = 'Requested Resubmission'
          AND EXISTS (
              SELECT 1
              FROM demos_app.deliverable_action AS da
              WHERE da.deliverable_id = d.id
                AND da.action_type_id = 'Submitted Deliverable'
          )
          AND EXISTS (
              SELECT 1
              FROM demos_app.deliverable_action AS da
              WHERE da.deliverable_id = d.id
                AND da.action_type_id = 'Migrated Deliverable From PMDA'
                AND da.old_status_id = 'Upcoming'
                AND da.new_status_id = 'Upcoming'
          )
          AND EXISTS (
              SELECT 1
              FROM demos_app.deliverable_action AS da
              WHERE da.deliverable_id = d.id
                AND da.action_type_id = 'Marked as Past Due'
                AND da.old_status_id = 'Upcoming'
                AND da.new_status_id = 'Past Due'
          )
          AND NOT EXISTS (
              SELECT 1
              FROM demos_app.deliverable_action AS da
              WHERE da.deliverable_id = d.id
                AND da.action_type_id IN (
                    'Requested Resubmission',
                    'Requested Extension',
                    'Started Review',
                    'Accepted Deliverable',
                    'Approved Deliverable',
                    'Received and Filed Deliverable'
                )
          )
        ORDER BY d.id
    LOOP
        UPDATE demos_app.deliverable
        SET status_id = 'Submitted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_deliverable.id
          AND status_id = 'Past Due';
        GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

        IF v_rows_affected != 1 THEN
            RAISE EXCEPTION 'Expected exactly 1 status update for deliverable_id=%, but % rows were affected', v_deliverable.id, v_rows_affected;
        END IF;

        v_total_rows := v_total_rows + v_rows_affected;
    END LOOP;

    IF v_total_rows != 13 THEN
        RAISE EXCEPTION 'Expected exactly 13 eligible deliverables; got %. Re-run the diagnostic query and review current statuses before applying.', v_total_rows;
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
          AND d.status_id = 'Past Due'
    ) AS listed_rows_still_past_due
FROM pg_temp.data_fix_result AS result;
