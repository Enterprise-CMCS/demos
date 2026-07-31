SELECT * FROM {{ ref('docs_pmda_app_docs_with_application') }}
WHERE application_id IS NULL
