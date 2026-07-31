SELECT * FROM {{ ref('docs_pmda_docs_rpstry') }}
WHERE _legacy_mdcd_demo_aplctn_doc_rpstry_fil_id IS NULL
