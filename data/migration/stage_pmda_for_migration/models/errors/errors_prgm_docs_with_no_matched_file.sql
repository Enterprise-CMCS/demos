SELECT * FROM {{ ref('docs_pmda_prgm_docs_rpstry_with_demo') }}
WHERE pmda_s3_file_id IS NULL
