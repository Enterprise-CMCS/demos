SELECT
    person_id,
    demonstration_id,
    role_id
FROM
    {{ ref('cleaned_demos_app_demo_role_except_primary_pos') }}
WHERE
    _internal_is_primary
