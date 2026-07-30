SELECT
    id,
    name, -- noqa: RF04
    description,
    s3_path,
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
    _legacy_mdcd_demo_aplctn_id,
    _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id
FROM {{ ref('cleaned_demos_app_application_docs') }}
WHERE _legacy_mdcd_demo_aplctn_id IS NOT NULL
