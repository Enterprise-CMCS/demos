SELECT
    *,
    TRUE AS is_migrated_from_pmda
FROM {{ ref('cleaned_demos_app_application_date_in_prog_demos') }}
