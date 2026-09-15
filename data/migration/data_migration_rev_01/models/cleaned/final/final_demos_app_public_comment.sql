SELECT
    id,
    deliverable_id,
    author_user_id,
    content,
    created_at,
    updated_at,
    is_migrated_from_pmda,
    _legacy_mdcd_dlvrbl_cmt_id,
    _legacy_mdcd_dlvrbl_id,
    _legacy_mdcd_dlvrbl_cmt_user_id
FROM
    {{ ref('cleaned_demos_app_comments') }}
WHERE
    _internal_demos_comment_type = 'Public'
