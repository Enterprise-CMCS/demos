-- ticket:             DEMOS-3197
-- author:             TBD
-- data_owner:         TBD
-- environments:       dev, test, impl
-- expected_rows:      4
-- source:             Revert Flint Michigan 1115 and Utah Traditional Healing federal comment period corrections
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            none
-- reverses:           20261125_DEMOS-3197_federal_comment_period_fixes.sql
--
-- Reverts the known Flint Michigan and Utah federal comment period corrections.
-- Nebraska and Washington are not changed because their target dates are pending.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_application_id CONSTANT uuid := 'eaa4c828-7fb3-4a90-8b74-8aee0bc5b1b8'::uuid;
    v_rows_affected int;
    v_total_rows int := 0;
BEGIN
    DELETE FROM demos_app.application_date
    WHERE application_id = v_application_id
      AND date_type_id = 'Federal Comment Period Start Date'
      AND date_value = '2026-01-06 00:00:00-05'::timestamptz;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Flint Michigan start-date row to revert, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    DELETE FROM demos_app.application_date
    WHERE application_id = v_application_id
      AND date_type_id = 'Federal Comment Period End Date'
      AND date_value = '2026-02-05 23:59:59.999-05'::timestamptz;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Flint Michigan end-date row to revert, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    DELETE FROM demos_app.application_date
    WHERE application_id = '637b363c-aafd-4210-8a9f-0baa98bec921'::uuid
      AND date_type_id = 'Federal Comment Period Start Date'
      AND date_value = '2024-12-03 00:00:00-05'::timestamptz;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Utah start-date row to revert, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    DELETE FROM demos_app.application_date
    WHERE application_id = '637b363c-aafd-4210-8a9f-0baa98bec921'::uuid
      AND date_type_id = 'Federal Comment Period End Date'
      AND date_value = '2025-01-01 23:59:59.999-05'::timestamptz;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Utah end-date row to revert, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_total_rows);
END
$$;

SELECT
    result.rows_affected,
    application_ids.application_id,
    COUNT(application_date.application_id) AS remaining_federal_comment_rows
FROM data_fix_result AS result
CROSS JOIN (
    VALUES
        ('eaa4c828-7fb3-4a90-8b74-8aee0bc5b1b8'::uuid),
        ('637b363c-aafd-4210-8a9f-0baa98bec921'::uuid)
) AS application_ids(application_id)
LEFT JOIN demos_app.application_date
    ON application_date.application_id = application_ids.application_id
   AND application_date.date_type_id IN (
       'Federal Comment Period Start Date',
       'Federal Comment Period End Date'
   )
GROUP BY result.rows_affected, application_ids.application_id
ORDER BY application_ids.application_id;
