SELECT
    id,
    person_type_id,
    NULL AS cognito_subject,
    NULL AS username,
    TRUE AS is_migrated_from_pmda,
    FALSE AS has_logged_in,
    created_at,
    updated_at
FROM
    {{ ref( 'cleaned_demos_app_person') }}
