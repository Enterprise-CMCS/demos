SELECT _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('cleaned_demos_app_application_docs') }}
WHERE _legacy_mdcd_demo_aplctn_id IS NULL
