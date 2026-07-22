SELECT
    id,
    application_type_id,
    TRUE AS is_migrated_from_pmda
FROM
    {{ ref('cleaned_demos_app_demonstration_finalized_demos') }}
