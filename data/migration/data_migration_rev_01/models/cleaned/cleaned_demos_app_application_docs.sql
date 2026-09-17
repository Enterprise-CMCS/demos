WITH no_s3_path AS (
    SELECT
        gen_random_uuid() AS id,
        docs.name, -- noqa: RF04
        docs.description,
        docs.owner_user_id,
        docs.document_type_id,
        docs.application_id,
        docs.phase_id,
        NULL::UUID AS deliverable_id,
        NULL::TEXT AS deliverable_type_id,
        NULL::BOOLEAN AS deliverable_is_cms_attached_file,
        NULL::UUID AS deliverable_submission_action_id,
        NULL::TEXT AS deliverable_submission_action_type_id,
        docs.created_at,
        docs.updated_at,
        NULL::INTEGER AS _legacy_mdcd_dlvrbl_fil_doc_id,
        NULL::INTEGER AS _legacy_mdcd_dlvrbl_id,
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
        NULL::INTEGER AS _legacy_mdcd_demo_pgm_mntrg_doc_id,
        docs.pmda_s3_file_id AS _internal_pmda_s3_file_id

    FROM
        {{ ref('docs_pmda_app_docs_with_application') }} AS docs
    WHERE
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
            SELECT e1._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
            FROM {{ ref('errors_app_docs_missing_application') }} AS e1
        )
        AND
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
            SELECT e2._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
            FROM {{ ref('errors_app_docs_missing_aplctn_doc_rpstry_fil') }} AS e2
        )
        AND
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
            SELECT e3._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id FROM {{ ref('errors_app_docs_missing_owner') }} AS e3
        )
        AND
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
            SELECT e4._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
            FROM {{ ref('errors_app_docs_of_type_bn_workbook') }} AS e4
        )
        AND
        docs._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id NOT IN (
            SELECT e5._legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
            FROM {{ ref('errors_app_docs_with_no_matched_file') }} AS e5
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
    _internal_pmda_s3_file_id,
    NULL::BIGINT AS _internal_submission_id
FROM
    no_s3_path
