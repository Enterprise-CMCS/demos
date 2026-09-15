-- Single table for all comments to start
SELECT
    gen_random_uuid() AS id,
    deliverable_id,
    author_user_id,
    author_person_type_id,
    content,
    creatd_dt AS created_at,
    creatd_dt AS updated_at,
    TRUE AS is_migrated_from_pmda,
    _legacy_mdcd_dlvrbl_cmt_id,
    _legacy_mdcd_dlvrbl_id,
    _legacy_mdcd_dlvrbl_cmt_user_id,
    CASE
        WHEN author_person_type_id IN ('demos-admin', 'demos-cms-user') THEN 'Private'
        WHEN author_person_type_id IN ('demos-state-user') THEN 'Public'
    END AS _internal_demos_comment_type
FROM
    {{ ref('deliverables_pmda_dlvrbl_comment') }}
WHERE
    _legacy_mdcd_dlvrbl_cmt_id NOT IN (
        SELECT e1._legacy_mdcd_dlvrbl_cmt_id FROM {{ ref('errors_deliv_comments_with_no_matched_deliv') }} AS e1
    )
    AND _legacy_mdcd_dlvrbl_cmt_id NOT IN (
        SELECT e2._legacy_mdcd_dlvrbl_cmt_id FROM {{ ref('errors_deliv_comments_with_no_matched_user') }} AS e2
    )
    AND _legacy_mdcd_dlvrbl_cmt_id NOT IN (
        SELECT e3._legacy_mdcd_dlvrbl_cmt_id FROM {{ ref('errors_deliv_comments_with_empty_content') }} AS e3
    )
