SELECT
    person_id,
    demonstration_id,
    role_id
FROM
    {{ ref('cleaned_demos_app_demo_role_prim_po_in_prog_demos') }}
WHERE
    _internal_grant_type = 'Primary Project Officer'
