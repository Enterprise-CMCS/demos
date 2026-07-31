SELECT * FROM {{ ref('docs_pmda_docs_with_application') }}
WHERE application_id IS NULL
