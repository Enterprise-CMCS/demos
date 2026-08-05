WITH no_s3_path AS (
    SELECT
        gen_random_uuid() AS id,
        doc.name, -- noqa: RF04
        doc.description,
        doc.owner_user_id,
        doc.document_type_id,
        doc.application_id,
        NULL::TEXT AS phase_id,
        NULL::UUID AS deliverable_id,
        NULL::TEXT AS deliverable_type_id,
        NULL::BOOLEAN AS deliverable_is_cms_attached_file,
        NULL::UUID AS deliverable_submission_action_id,
        NULL::TEXT AS deliverable_submission_action_type_id,
        doc.created_at,
        doc.updated_at,
        NULL::INTEGER AS _legacy_mdcd_dlvrbl_fil_doc_id,
        NULL::INTEGER AS _legacy_mdcd_dlvrbl_id,
        NULL::INTEGER AS _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
        doc._legacy_mdcd_demo_pgm_mntrg_doc_id
    FROM {{ ref('docs_pmda_prgm_docs_rpstry_with_demo') }} AS doc
    WHERE
        doc._legacy_mdcd_demo_pgm_mntrg_doc_id NOT IN (
            SELECT e1._legacy_mdcd_demo_pgm_mntrg_doc_id
            FROM {{ ref('errors_prgm_docs_with_no_resolved_demo') }} AS e1
        )
        AND doc._legacy_mdcd_demo_pgm_mntrg_doc_id NOT IN (
            SELECT e2._legacy_mdcd_demo_pgm_mntrg_doc_id
            FROM {{ ref('errors_prgm_docs_with_no_resolved_owner') }} AS e2
        )
)

SELECT
    id,
    name,
    description,
    application_id || '/' || id AS s3_path,
    owner_user_id,
    document_type_id,
    application_id,
    phase_id,
    deliverable_id,
    deliverable_type_id,
    deliverable_is_cms_attached_file,
    deliverable_submission_action_id,
    deliverable_submission_action_type_id,
    created_at,
    updated_at,
    _legacy_mdcd_dlvrbl_fil_doc_id,
    _legacy_mdcd_dlvrbl_id,
    _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
    _legacy_mdcd_demo_pgm_mntrg_doc_id,
    NULL::BIGINT AS _internal_pmda_s3_file_id
FROM
    no_s3_path
