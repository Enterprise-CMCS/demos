SELECT
    gen_random_uuid() AS id,
    docs.orgnl_fil_name AS name, -- noqa: RF04
    docs.mdcd_demo_aplctn_doc_desc AS description,
    'temp' AS s3_path,
    docs.owner_user_id,
    docs.document_type_id,
    docs.id AS application_id,
    docs.phase_id,
    NULL::UUID AS deliverable_id,
    NULL::TEXT AS deliverable_type_id,
    NULL::BOOLEAN AS deliverable_is_cms_attached_file,
    NULL::UUID AS deliverable_submission_action_id,
    NULL::TEXT AS deliverable_submission_action_type_id,
    docs.created_at,
    docs.updated_at
FROM {{ ref('docs_pmda_docs_with_application') }} AS docs
WHERE
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
        SELECT e1.mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('errors_docs_missing_application') }} AS e1
    )
    AND
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
        SELECT e2.mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('errors_docs_missing_file') }} AS e2
    )
    AND
    docs.mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
        SELECT e3.mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('errors_docs_missing_owner') }} AS e3
    )
