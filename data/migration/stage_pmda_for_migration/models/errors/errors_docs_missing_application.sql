SELECT mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('docs_pmda_docs_with_application') }}
WHERE mdcd_demo_aplctn_id IS NULL
