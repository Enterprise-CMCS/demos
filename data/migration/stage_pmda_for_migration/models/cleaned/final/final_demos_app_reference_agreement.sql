WITH liz_hill AS (
    SELECT
        id,
        person_type_id
    FROM
        {{ ref('final_demos_app_person') }}
    WHERE
        _legacy_users_id = 828
),

with_uuids AS (
    SELECT
        gen_random_uuid() AS id,
        pmda_agreements.name,
        liz_hill.id AS owner_user_id,
        liz_hill.person_type_id AS owner_person_type_id,
        pmda_agreements.created_at,
        pmda_agreements.updated_at,
        pmda_agreements._internal_reference_agreement_id,
        pmda_agreements.pmda_s3_file_id AS _internal_pmda_s3_file_id
    FROM
        {{ ref('references_pmda_ref_agreements') }} AS pmda_agreements
    INNER JOIN
        liz_hill
        ON
            TRUE
)

SELECT
    id,
    name,
    'references/agreements/' || id AS s3_path,
    owner_user_id,
    owner_person_type_id,
    created_at,
    updated_at,
    _internal_reference_agreement_id,
    _internal_pmda_s3_file_id
FROM
    with_uuids
