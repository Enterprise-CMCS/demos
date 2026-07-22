SELECT
    id,
    deliverable_type_id,
    trim(name) AS name, -- noqa: RF04
    demonstration_id,
    demonstration_status_id,
    status_id,
    cms_owner_user_id,
    cms_owner_person_type_id,
    due_date,
    due_date_type_id,
    expected_to_be_submitted,
    created_at,
    updated_at,
    _legacy_mdcd_demo_id,
    _legacy_mdcd_dlvrbl_id
FROM
    {{ ref('deliverables_crosswalked_pmda_with_fixes') }}
WHERE
    _legacy_mdcd_demo_id NOT IN (
        SELECT e1._legacy_mdcd_demo_id
        FROM {{ ref('errors_active_crosswaked_pmda_deliverables_with_no_final_demo') }} AS e1
    )
