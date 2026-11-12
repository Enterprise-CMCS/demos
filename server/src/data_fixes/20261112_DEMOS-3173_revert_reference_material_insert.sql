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
    v_deleted_rows int;
    v_rows_affected int := 0;
BEGIN
    DELETE FROM demos_app.reference_demonstration_type AS rdt
    USING demos_app.reference AS r
    WHERE rdt.reference_id = r.id
        AND r.name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND r.owner_person_type_id = 'demos-admin'
        AND demonstration_type_tag_name_id = 'ReEntry'
        AND demonstration_type_tag_type_id = 'Demonstration Type';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'expected to delete 1 reference demonstration type, deleted %', v_deleted_rows;
    END IF;
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
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'expected to delete 1 reference configuration, deleted %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference
    WHERE name = 'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026'
        AND owner_person_type_id = 'demos-admin';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'expected to delete 1 reference, deleted %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    DELETE FROM demos_app.reference_agreement
    WHERE name = '1115 Reentry Specs Manual End User License Agreement v1'
        AND owner_person_type_id = 'demos-admin';
    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    IF v_deleted_rows <> 1 THEN
        RAISE EXCEPTION 'expected to delete 1 reference agreement, deleted %', v_deleted_rows;
    END IF;
    v_rows_affected := v_rows_affected + v_deleted_rows;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_rows_affected);
END
$$;
