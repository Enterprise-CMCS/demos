SELECT * FROM {{ ref('docs_pmda_app_docs_with_person') }}
WHERE owner_user_id IS NULL
