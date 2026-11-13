-- ticket:             DEMOS-3173
-- author:             Connor J. Parke
-- data_owner:         Connor J. Parke
-- environments:       dev, test, impl, prod
-- expected_rows:      4
-- source:             Customer requested reference material and agreement addition
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            20261112_DEMOS-3173_revert_reference_material_insert.sql
--
-- Adds a reference material and associated agreement under a new reference 
-- configuration, then assigns a demonstration type to the material.
-- requires that the associated reference and agreement are added to s3  


CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_reference_id uuid := gen_random_uuid();
    v_reference_agreement_id uuid := gen_random_uuid();
    v_reference_configuration_id uuid := gen_random_uuid();
    v_owner_user_id uuid;
    v_rows_affected int := 0;
BEGIN
    v_owner_user_id := (
        SELECT p.id
        FROM demos_app.person AS p
        JOIN demos_app.users AS u
            ON u.id = p.id
            AND u.person_type_id = p.person_type_id
        WHERE p.first_name = '<>'
            AND p.last_name = '<>'
            AND p.person_type_id = 'demos-admin'
    );

    IF v_owner_user_id IS NULL THEN
        RAISE EXCEPTION 'expected to find CMS admin <>';
    END IF;

    INSERT INTO demos_app.reference (
        id,
        name,
        description,
        s3_path,
        owner_user_id,
        owner_person_type_id,
        created_at,
        updated_at
    ) VALUES (
        v_reference_id,
        'Section 1115 Reentry Monitoring Metrics Technical Specifications v1.0, released 2026',
        'Zip file includes technical specifications and supporting documents for monitoring metrics for section 1115 reentry demonstrations. States should use the latest version of the manual available (as identified by the version number) to calculate CMS-constructed metrics.',
        'references/' || v_reference_id,
        v_owner_user_id,
        'demos-admin',
        current_timestamp,
        current_timestamp
    );
    v_rows_affected := v_rows_affected + 1;

    INSERT INTO demos_app.reference_agreement (
        id,
        name,
        s3_path,
        owner_user_id,
        owner_person_type_id,
        created_at,
        updated_at
    ) VALUES (
        v_reference_agreement_id,
        '1115 Reentry Specs Manual End User License Agreement v1',
        'references/agreements/' || v_reference_agreement_id,
        v_owner_user_id,
        'demos-admin',
        current_timestamp,
        current_timestamp
    );
    v_rows_affected := v_rows_affected + 1;

    INSERT INTO demos_app.reference_configuration (
        id,
        reference_id,
        reference_agreement_id,
        status_id
    ) VALUES (
        v_reference_configuration_id,
        v_reference_id,
        v_reference_agreement_id,
        'Active'
    );
    v_rows_affected := v_rows_affected + 1;

    INSERT INTO demos_app.reference_demonstration_type (
        reference_id,
        demonstration_type_tag_name_id,
        demonstration_type_tag_type_id
    ) VALUES (
        v_reference_id,
        'ReEntry',
        'Demonstration Type'
    );
    v_rows_affected := v_rows_affected + 1;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_rows_affected);
END
$$;
