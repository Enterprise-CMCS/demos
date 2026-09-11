WITH no_s3_path AS (
    SELECT
        gen_random_uuid() AS id,
        trim(deliv_docs.doc_name) AS name, -- noqa: RF04,
        trim(deliv_docs.intrnl_cmt_txt) AS description,
        deliv_docs.demos_user_id AS owner_user_id,
        'General File' AS document_type_id,
        deliv_docs.demos_demonstration_id AS application_id,
        NULL AS phase_id,
        deliv_docs.demos_deliverable_id AS deliverable_id,
        deliv_docs.demos_deliverable_type_id AS deliverable_type_id,
        deliv_docs.cmt_orgn_cd = 'C' AS deliverable_is_cms_attached_file,
        CASE
            WHEN deliv_docs.cmt_orgn_cd = 'C' THEN NULL
            ELSE clean_sub_evt.id
        END AS deliverable_submission_action_id,
        CASE
            WHEN deliv_docs.cmt_orgn_cd = 'C' THEN NULL
            ELSE 'Submitted Deliverable'
        END AS deliverable_submission_action_type_id,
        deliv_docs.creatd_dt AS created_at,
        deliv_docs.creatd_dt AS updated_at,
        deliv_docs.mdcd_dlvrbl_fil_doc_id AS _legacy_mdcd_dlvrbl_fil_doc_id,
        deliv_docs.mdcd_dlvrbl_id AS _legacy_mdcd_dlvrbl_id,
        NULL::INTEGER AS _legacy_mdcd_demo_aplctn_doc_rpstry_dtl_id,
        NULL::INTEGER AS _legacy_mdcd_demo_pgm_mntrg_doc_id,
        deliv_docs.pmda_s3_file_id AS _internal_pmda_s3_file_id,
        deliv_docs._internal_submission_id

    FROM
        {{ ref('docs_base_pmda_deliv_docs') }} AS deliv_docs
    LEFT JOIN
        {{ ref('cleaned_demos_app_deliverable_action_submission_events') }} AS clean_sub_evt
        ON
            deliv_docs._internal_submission_id = clean_sub_evt._internal_submission_id
    WHERE
        deliv_docs.mdcd_dlvrbl_fil_doc_id NOT IN (
            SELECT e1.mdcd_dlvrbl_fil_doc_id FROM {{ ref('errors_deliv_docs_with_no_resolved_deliverable') }} AS e1
        )
        AND deliv_docs.mdcd_dlvrbl_fil_doc_id NOT IN (
            SELECT e2.mdcd_dlvrbl_fil_doc_id FROM {{ ref('errors_deliv_docs_with_no_resolved_owner') }} AS e2
        )
        AND deliv_docs.mdcd_dlvrbl_fil_doc_id NOT IN (
            SELECT e3.mdcd_dlvrbl_fil_doc_id FROM {{ ref('errors_deliv_docs_with_no_matched_file') }} AS e3
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
    _internal_submission_id
FROM
    no_s3_path
