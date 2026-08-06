-- Note: something with no state documents is not considered a submission
-- CMS documents are not part of submissions
WITH possible_submissions AS (
    SELECT
        _internal_submission_id,
        _internal_submission_date,
        mdcd_dlvrbl_id AS _legacy_mdcd_dlvrbl_id,
        user_id AS _legacy_mdcd_dlvrbl_fil_doc_user_id,
        demos_deliverable_id,
        demos_user_id,
        sum(CASE WHEN cmt_orgn_cd = 'S' THEN 1 ELSE 0 END) AS n_state_docs
    FROM
        {{ ref('docs_base_pmda_deliv_docs') }}
    GROUP BY
        _internal_submission_id,
        _internal_submission_date,
        mdcd_dlvrbl_id,
        user_id,
        demos_deliverable_id,
        demos_user_id
)

SELECT *
FROM
    possible_submissions
WHERE n_state_docs > 0
