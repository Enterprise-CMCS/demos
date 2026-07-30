SELECT mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('docs_pmda_docs_with_person') }}
WHERE owner_user_id IS NULL
