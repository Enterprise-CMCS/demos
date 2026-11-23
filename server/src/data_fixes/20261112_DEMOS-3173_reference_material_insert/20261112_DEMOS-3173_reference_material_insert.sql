-- ticket:             DEMOS-3173
-- author:             Connor J. Parke
-- data_owner:         Stephanie Hauf
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

/*
 Generating UUIDs for reference, reference agreement, and reference configuration entries
    set -euo pipefail
    reference_id="$(uuidgen | tr '[:upper:]' '[:lower:]')"
    agreement_id="$(uuidgen | tr '[:upper:]' '[:lower:]')"
    configuration_id="$(uuidgen | tr '[:upper:]' '[:lower:]')"
    test "$reference_id" != "$agreement_id"
    test "$reference_id" != "$configuration_id"
    test "$agreement_id" != "$configuration_id"
    printf 'reference_id=%s\nagreement_id=%s\nconfiguration_id=%s\n' \
    "$reference_id" "$agreement_id" "$configuration_id"
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
    v_owner_user_id uuid;
    v_rows_affected int := 0;
BEGIN
    v_owner_user_id := (
        SELECT p.id
        FROM demos_app.person AS p
        JOIN demos_app.users AS u
            ON u.id = p.id
            AND u.person_type_id = p.person_type_id
        -- only production has this user, for lower environments we can use the bypassed user instead
        -- WHERE p.email = 'bypassedUser@email.com'
        WHERE p.email = 'elizabeth.hill@cms.hhs.gov'
            AND p.person_type_id = 'demos-admin'
    );

    IF v_owner_user_id IS NULL THEN
        RAISE EXCEPTION 'expected to find CMS admin Elizabeth Hill';
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

    -- Manually validated that each environment has the ReEntry demonstration type
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

SELECT
    result.rows_affected,
    (SELECT count(*) FROM demos_app.reference
    -- replace with known UUID
    WHERE reference.id = '8843ff9d-93f2-4337-8b20-c056b72415b4'::UUID) AS reference_rows,
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
