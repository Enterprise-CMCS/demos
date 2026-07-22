-- Define fallback CMS owner as Liz Hill
WITH fallback_cms_owner AS (
    SELECT
        id,
        person_type_id
    FROM
        {{ ref('final_demos_app_person') }}
    WHERE
        _legacy_id = 828
)

SELECT
    deliv.id,
    deliv.deliverable_type_id,
    deliv.name, -- noqa: RF04,
    deliv.demonstration_id,
    deliv.demonstration_status_id,
    deliv.status_id,
    coalesce(deliv.cms_owner_user_id, fb.id) AS cms_owner_user_id,
    coalesce(deliv.cms_owner_person_type_id, fb.person_type_id) AS cms_owner_person_type_id,
    CASE
        WHEN f_demo.expiration_date IS NULL THEN NULL
        WHEN deliv.due_date_type_id = 'Open Ended' THEN f_demo.expiration_date
        ELSE deliv.due_date
    END AS due_date,
    deliv.due_date_type_id,
    deliv.expected_to_be_submitted,
    deliv.created_at,
    deliv.updated_at,
    deliv._legacy_mdcd_demo_id,
    deliv._legacy_mdcd_dlvrbl_id
FROM
    {{ ref('deliverables_crosswalked_pmda_deliverables') }} AS deliv
LEFT JOIN
    {{ ref('final_demos_app_demonstration') }} AS f_demo
    ON
        deliv.demonstration_id = f_demo.id
INNER JOIN
    fallback_cms_owner AS fb
    ON
        TRUE
