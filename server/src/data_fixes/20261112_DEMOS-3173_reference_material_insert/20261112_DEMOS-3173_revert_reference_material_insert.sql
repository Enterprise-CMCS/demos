-- ticket:             DEMOS-3173
-- author:             Connor J. Parke
-- data_owner:         Stephanie Hauf
-- environments:       dev, test, impl, prod
-- expected_rows:      4
-- source:             Reverse of the DEMOS-3173 reference material fix
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            none
-- reverses:           20261112_DEMOS-3173_reference_material_insert.sql

/*
    Referencing same uuids as in 20261112_DEMOS-3173_reference_material_insert.sql

    reference_id=8843ff9d-93f2-4337-8b20-c056b72415b4
    agreement_id=110896fe-0aec-4d37-927f-c0d35d53840f
    configuration_id=20d17a6d-41b7-436f-8f65-3a51919de0f4
*/

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_reference_id CONSTANT uuid := '8843ff9d-93f2-4337-8b20-c056b72415b4'::uuid;
    v_reference_agreement_id CONSTANT uuid := '110896fe-0aec-4d37-927f-c0d35d53840f'::uuid;
    v_reference_configuration_id CONSTANT uuid := '20d17a6d-41b7-436f-8f65-3a51919de0f4'::uuid;
    v_deleted_rows int;
    v_rows_affected int := 0;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM demos_app.reference
        WHERE id = v_reference_id
    ) THEN
        RAISE EXCEPTION 'expected reference material to exist before reverting';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM demos_app.reference_agreement
        WHERE id = v_reference_agreement_id
    ) THEN
        RAISE EXCEPTION 'expected reference agreement to exist before reverting';
    END IF;

    DELETE FROM demos_app.reference_demonstration_type
    WHERE reference_id = v_reference_id
        AND demonstration_type_tag_name_id = 'ReEntry'
        AND demonstration_type_tag_type_id = 'Demonstration Type';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'Expected 1 type-link deletion; got %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference_configuration
    WHERE id = v_reference_configuration_id;
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'Expected 1 reference configuration deletion; got %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference
    WHERE id = v_reference_id;
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'Expected 1 reference material deletion; got %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference_agreement
    WHERE id = v_reference_agreement_id;
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'Expected 1 reference agreement deletion; got %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_rows_affected);
END
$$;

SELECT
    result.rows_affected,
    (
        SELECT count(*) FROM demos_app.reference
        WHERE reference.id = '8843ff9d-93f2-4337-8b20-c056b72415b4'::UUID
    ) AS reference_rows,
    (
        SELECT count(*) FROM demos_app.reference_agreement
        WHERE reference_agreement.id = '110896fe-0aec-4d37-927f-c0d35d53840f'::UUID
    ) AS agreement_rows,
    (
        SELECT count(*) FROM demos_app.reference_configuration
        WHERE reference_configuration.id = '20d17a6d-41b7-436f-8f65-3a51919de0f4'::UUID
    ) AS configuration_rows,
    (
        SELECT count(*) FROM demos_app.reference_demonstration_type
        WHERE
            reference_demonstration_type.reference_id = '8843ff9d-93f2-4337-8b20-c056b72415b4'::UUID
            AND reference_demonstration_type.demonstration_type_tag_name_id = 'ReEntry'
            AND reference_demonstration_type.demonstration_type_tag_type_id = 'Demonstration Type'
    ) AS type_link_rows
FROM pg_temp.data_fix_result AS result;
