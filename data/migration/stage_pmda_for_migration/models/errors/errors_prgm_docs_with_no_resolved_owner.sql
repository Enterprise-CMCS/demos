SELECT * FROM {{ ref('docs_pmda_prgm_docs_rpstry_with_person') }}
WHERE owner_user_id IS NULL
