SELECT mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('docs_pmda_docs_rpstry') }}
WHERE mdcd_demo_aplctn_doc_rpstry_fil_id IS NULL
