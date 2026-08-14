SELECT * FROM {{ ref('docs_pmda_app_docs_rpstry') }}
WHERE pmda_s3_file_id IS NULL
