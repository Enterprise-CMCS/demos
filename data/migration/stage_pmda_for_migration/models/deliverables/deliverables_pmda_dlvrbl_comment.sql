SELECT
    pmda_comment.mdcd_dlvrbl_cmt_id AS _legacy_mdcd_dlvrbl_cmt_id,
    pmda_comment.mdcd_dlvrbl_id AS _legacy_mdcd_dlvrbl_id,
    pmda_comment.user_id AS _legacy_mdcd_dlvrbl_cmt_user_id,
    trim(pmda_comment.cmt_txt) AS content, -- noqa: RF04
    pmda_comment.creatd_dt,
    pmda_comment.cmt_orgn_cd,
    pmda_comment.cmt_aftr_acptd_ind,
    deliv.id AS deliverable_id,
    person.id AS author_user_id,
    person.person_type_id AS author_person_type_id
FROM
    {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_cmt') }} AS pmda_comment

LEFT JOIN
    {{ ref('final_demos_app_deliverable') }} AS deliv
    ON
        pmda_comment.mdcd_dlvrbl_id = deliv._legacy_mdcd_dlvrbl_id

-- Only interested in comments from users, hence the person type ID filter
LEFT JOIN
    {{ ref('final_demos_app_person') }} AS person
    ON
        pmda_comment.user_id = person._legacy_users_id
        AND person.person_type_id IN ('demos-admin', 'demos-cms-user', 'demos-state-user')
