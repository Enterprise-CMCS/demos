-- ticket:             DEMOS-3197
-- author:             TBD
-- data_owner:         TBD
-- environments:       dev, test, impl
-- expected_rows:      4
-- source:             Flint Michigan 1115 and Utah Traditional Healing state application corrections
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            20261125_DEMOS-3197_revert_federal_comment_period_fixes.sql
--
-- Correct known federal comment periods:
-- Flint Michigan: 01/06/2026-02/05/2026
-- Utah Traditional Healing: 12/03/2024-01/01/2025
-- Nebraska and Washington are excluded until their target dates are confirmed.
-- All rows are marked as manual corrections rather than PMDA migrations.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_application_id CONSTANT uuid := 'eaa4c828-7fb3-4a90-8b74-8aee0bc5b1b8'::uuid;
    v_rows_affected int;
    v_total_rows int := 0;
BEGIN
    INSERT INTO demos_app.application_date (
        application_id,
        date_type_id,
        date_value,
        created_at,
        updated_at,
        is_migrated_from_pmda
    ) VALUES (
        v_application_id,
        'Federal Comment Period Start Date',
        '2026-01-06 00:00:00-05'::timestamptz,
        current_timestamp,
        current_timestamp,
        false
    )
    ON CONFLICT (application_id, date_type_id)
    DO UPDATE SET
        date_value = EXCLUDED.date_value,
        updated_at = current_timestamp,
        is_migrated_from_pmda = false;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 start-date row for Flint Michigan, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    INSERT INTO demos_app.application_date (
        application_id,
        date_type_id,
        date_value,
        created_at,
        updated_at,
        is_migrated_from_pmda
    ) VALUES (
        v_application_id,
        'Federal Comment Period End Date',
        '2026-02-05 23:59:59.999-05'::timestamptz,
        current_timestamp,
        current_timestamp,
        false
    )
    ON CONFLICT (application_id, date_type_id)
    DO UPDATE SET
        date_value = EXCLUDED.date_value,
        updated_at = current_timestamp,
        is_migrated_from_pmda = false;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 end-date row for Flint Michigan, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    INSERT INTO demos_app.application_date (
        application_id,
        date_type_id,
        date_value,
        created_at,
        updated_at,
        is_migrated_from_pmda
    ) VALUES (
        '637b363c-aafd-4210-8a9f-0baa98bec921'::uuid,
        'Federal Comment Period Start Date',
        '2024-12-03 00:00:00-05'::timestamptz,
        current_timestamp,
        current_timestamp,
        false
    )
    ON CONFLICT (application_id, date_type_id)
    DO UPDATE SET
        date_value = EXCLUDED.date_value,
        updated_at = current_timestamp,
        is_migrated_from_pmda = false;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Utah start-date row, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    INSERT INTO demos_app.application_date (
        application_id,
        date_type_id,
        date_value,
        created_at,
        updated_at,
        is_migrated_from_pmda
    ) VALUES (
        '637b363c-aafd-4210-8a9f-0baa98bec921'::uuid,
        'Federal Comment Period End Date',
        '2025-01-01 23:59:59.999-05'::timestamptz,
        current_timestamp,
        current_timestamp,
        false
    )
    ON CONFLICT (application_id, date_type_id)
    DO UPDATE SET
        date_value = EXCLUDED.date_value,
        updated_at = current_timestamp,
        is_migrated_from_pmda = false;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
        RAISE EXCEPTION 'Expected exactly 1 Utah end-date row, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + v_rows_affected;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_total_rows);
END
$$;

SELECT
    result.rows_affected,
    application_date.application_id,
    MAX(application_date.date_value) FILTER (
        WHERE application_date.date_type_id = 'Federal Comment Period Start Date'
    )::date AS federal_comment_start,
    MAX(application_date.date_value) FILTER (
        WHERE application_date.date_type_id = 'Federal Comment Period End Date'
    )::date AS federal_comment_end,
    BOOL_AND(application_date.is_migrated_from_pmda = false) AS is_manual_override
FROM data_fix_result AS result
JOIN demos_app.application_date
    ON application_date.application_id IN (
        'eaa4c828-7fb3-4a90-8b74-8aee0bc5b1b8'::uuid,
        '637b363c-aafd-4210-8a9f-0baa98bec921'::uuid
    )
   AND application_date.date_type_id IN (
       'Federal Comment Period Start Date',
       'Federal Comment Period End Date'
   )
GROUP BY result.rows_affected, application_date.application_id
ORDER BY application_date.application_id;
