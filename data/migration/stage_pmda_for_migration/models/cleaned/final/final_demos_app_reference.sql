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
        pmda_refs.rfrnc_matl_name AS name, -- noqa: RF04
        pmda_refs.rfrnc_matl_desc AS description,
        liz_hill.id AS owner_user_id,
        liz_hill.person_type_id AS owner_person_type_id,
        pmda_refs.creatd_dt AS created_at,
        pmda_refs.updtd_dt AS updated_at,
        pmda_refs.pmda_s3_file_id AS _internal_pmda_s3_file_id,
        pmda_refs._internal_reference_id,
        pmda_refs._internal_reference_agreement_id,
        pmda_refs.archived AS _legacy_archived_flag
    FROM
        {{ ref('references_pmda_refs') }} AS pmda_refs
    INNER JOIN
        liz_hill
        ON
            TRUE
)

SELECT
    id,
    name,
    description,
    'references/' || id AS s3_path,
    owner_user_id,
    owner_person_type_id,
    created_at,
    updated_at,
    _internal_pmda_s3_file_id,
    _internal_reference_id,
    _internal_reference_agreement_id,
    _legacy_archived_flag
FROM
    with_uuids
