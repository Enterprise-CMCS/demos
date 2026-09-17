SELECT * FROM {{ ref('docs_base_pmda_deliv_docs') }}
WHERE demos_user_id IS NULL
