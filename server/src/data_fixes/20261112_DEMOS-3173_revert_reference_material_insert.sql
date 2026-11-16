-- ticket:             DEMOS-3173
-- author:             Connor J. Parke
-- data_owner:         Connor J. Parke
-- environments:       dev, test, impl, prod
-- expected_rows:      4
-- source:             Reverse of the DEMOS-3173 reference material fix
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            none
-- reverses:           20261112_DEMOS-3173_reference_material_insert.sql

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_reference_ids uuid[];
    v_reference_agreement_ids uuid[];
    v_deleted_rows int;
    v_rows_affected int := 0;
BEGIN
    SELECT array_agg(id) INTO v_reference_ids
    FROM demos_app.reference
    WHERE name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND owner_person_type_id = 'demos-admin';

    SELECT array_agg(id) INTO v_reference_agreement_ids
    FROM demos_app.reference_agreement
    WHERE name = '1115 Reentry Specs Manual End User License Agreement v1'
        AND owner_person_type_id = 'demos-admin';

    DELETE FROM demos_app.reference_demonstration_type AS rdt
    USING demos_app.reference AS r
    WHERE rdt.reference_id = r.id
        AND r.name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND r.owner_person_type_id = 'demos-admin'
        AND demonstration_type_tag_name_id = 'ReEntry'
        AND demonstration_type_tag_type_id = 'Demonstration Type';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference_configuration AS rc
    USING demos_app.reference AS r, demos_app.reference_agreement AS ra
    WHERE rc.reference_id = r.id
        AND rc.reference_agreement_id = ra.id
        AND r.name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND ra.name = '1115 Reentry Specs Manual End User License Agreement v1'
        AND r.owner_person_type_id = 'demos-admin'
        AND ra.owner_person_type_id = 'demos-admin';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference
    WHERE name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND owner_person_type_id = 'demos-admin';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference_agreement
    WHERE name = '1115 Reentry Specs Manual End User License Agreement v1'
        AND owner_person_type_id = 'demos-admin';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    IF EXISTS (
        SELECT 1
        FROM demos_app.reference_demonstration_type
        WHERE reference_id = ANY(v_reference_ids)
            AND demonstration_type_tag_name_id = 'ReEntry'
            AND demonstration_type_tag_type_id = 'Demonstration Type'
    ) THEN
        RAISE EXCEPTION 'expected reference demonstration type to be removed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM demos_app.reference_configuration
        WHERE reference_id = ANY(v_reference_ids)
            AND reference_agreement_id = ANY(v_reference_agreement_ids)
    ) THEN
        RAISE EXCEPTION 'expected reference configuration to be removed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM demos_app.reference
        WHERE name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
            AND owner_person_type_id = 'demos-admin'
    ) THEN
        RAISE EXCEPTION 'expected reference material to be removed';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM demos_app.reference_agreement
        WHERE name = '1115 Reentry Specs Manual End User License Agreement v1'
            AND owner_person_type_id = 'demos-admin'
    ) THEN
        RAISE EXCEPTION 'expected reference agreement to be removed';
    END IF;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_rows_affected);
END
$$;
