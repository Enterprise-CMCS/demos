SELECT * FROM {{ ref('docs_pmda_prgm_docs_rpstry_with_demo') }}
WHERE application_id IS NULL
