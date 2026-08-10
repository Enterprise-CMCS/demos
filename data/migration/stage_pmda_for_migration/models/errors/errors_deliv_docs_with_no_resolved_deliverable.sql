SELECT * FROM {{ ref('docs_base_pmda_deliv_docs') }}
WHERE demos_deliverable_id IS NULL
