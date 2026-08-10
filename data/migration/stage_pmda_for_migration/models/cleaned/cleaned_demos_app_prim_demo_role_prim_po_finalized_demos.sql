SELECT
    person_id,
    demonstration_id,
    role_id
FROM
    {{ ref('cleaned_demos_app_demo_role_prim_po_finalized_demos') }}
WHERE
    role_id = 'Project Officer'
    AND _internal_is_primary
