WITH cleaned_demos_and_pos AS (
    SELECT
        id AS demonstration_id,
        state_id,
        -- Assign missing and unresolved project officers to Liz Hill
        CASE
            WHEN _legacy_proj_ofcr_user_id IS NULL THEN 828
            WHEN _legacy_proj_ofcr_user_id = 0 THEN 828
            ELSE _legacy_proj_ofcr_user_id
        END AS _legacy_proj_ofcr_user_id
    FROM
        {{ ref('cleaned_demos_app_demonstration_finalized_demos' ) }}
)

SELECT
    p.id AS person_id,
    pmda_po.demonstration_id,
    'Project Officer' AS role_id,
    pmda_po.state_id,
    p.person_type_id,
    'Demonstration' AS grant_level_id,
    'Primary Project Officer' AS _internal_grant_type
FROM
    cleaned_demos_and_pos AS pmda_po
LEFT JOIN
    {{ ref('cleaned_demos_app_person') }} AS p
    ON
        pmda_po._legacy_proj_ofcr_user_id = p._legacy_id
