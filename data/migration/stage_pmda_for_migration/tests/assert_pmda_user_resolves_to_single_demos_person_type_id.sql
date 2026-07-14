-- Warn in cases where the person_type_id resolution results in more than one person_type_id

{{ config(severity='warn') }}

SELECT user_id
FROM
    {{ ref('pmda_user_role_assignment_pivot') }}
WHERE
    (has_demos_admin + has_demos_cms_user + has_demos_state_user + has_non_user_contact) > 1
