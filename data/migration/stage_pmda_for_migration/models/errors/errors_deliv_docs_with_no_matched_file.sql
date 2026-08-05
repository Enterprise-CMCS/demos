SELECT * FROM {{ ref('docs_base_pmda_deliv_docs') }}
WHERE pmda_s3_file_id IS NULL
