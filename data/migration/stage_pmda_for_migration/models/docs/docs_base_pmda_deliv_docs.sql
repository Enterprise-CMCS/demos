WITH base_deliv_docs AS (
    SELECT
        deliv_doc.mdcd_dlvrbl_fil_doc_id,
        deliv_doc.mdcd_dlvrbl_id,
        deliv_doc.doc_name,
        deliv_doc.intrnl_cmt_txt,
        deliv_doc.dlvrbl_fil_name,
        deliv_doc.user_id,
        deliv_doc.creatd_dt,
        deliv_doc.dltd_ind,
        deliv_doc.cmt_orgn_cd,
        deliv_doc.bdgt_ntrlty_fil_ind,
        deliv_doc.mntrg_rpt_fil_ind,
        deliv_doc.mntrg_prtcl_fil_ind,
        deliv_doc.proc_mntrg_rpt_ind,
        f_deliv.id AS demos_deliverable_id,
        f_deliv.demonstration_id AS demos_demonstration_id,
        f_deliv.deliverable_type_id AS demos_deliverable_type_id,
        f_person.id AS demos_user_id,
        s3_files.pmda_s3_file_id
    FROM
        {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_fil_doc') }} AS deliv_doc
    LEFT JOIN
        {{ ref('final_demos_app_deliverable') }} AS f_deliv
        ON
            deliv_doc.mdcd_dlvrbl_id = f_deliv._legacy_mdcd_dlvrbl_id
    LEFT JOIN
        {{ ref('final_demos_app_person') }} AS f_person
        ON
            deliv_doc.user_id = f_person._legacy_users_id
    LEFT JOIN
        {{ ref('docs_pmda_s3_file_list') }} AS s3_files
        ON
            deliv_doc.dlvrbl_fil_name = s3_files.file_name
            AND deliv_doc.mdcd_dlvrbl_id = s3_files.deliv_extracted_mdcd_dlvrbl_id
            AND deliv_doc.cmt_orgn_cd = s3_files.deliv_extracted_cmt_orgn_cd
    WHERE
        deliv_doc.dltd_ind = 0
),

-- Defining a submission using the deliverable documents data
-- A submission is any group of files:
--   for the same deliverable
--   with the same user
--   that were created within five minutes of another file in the same submission
interval_time AS (
    SELECT
        mdcd_dlvrbl_fil_doc_id,
        mdcd_dlvrbl_id,
        user_id,
        creatd_dt,
        creatd_dt
        - lag(creatd_dt, 1)
            OVER (PARTITION BY mdcd_dlvrbl_id, user_id ORDER BY creatd_dt)
            AS interval_from_prev_creatd_dt
    FROM
        base_deliv_docs
),

-- Can tune the time here if we want to make more or less submissions
submission_ids AS (
    SELECT
        mdcd_dlvrbl_fil_doc_id,
        creatd_dt,
        sum(
            CASE
                WHEN interval_from_prev_creatd_dt IS NULL THEN 1
                WHEN interval_from_prev_creatd_dt <= '5 minutes'::INTERVAL THEN 0
                WHEN interval_from_prev_creatd_dt > '5 minutes'::INTERVAL THEN 1
            END
        ) OVER (ORDER BY mdcd_dlvrbl_id, user_id, creatd_dt) AS _internal_submission_id
    FROM
        interval_time
)

SELECT
    base_deliv_docs.mdcd_dlvrbl_fil_doc_id,
    base_deliv_docs.mdcd_dlvrbl_id,
    base_deliv_docs.doc_name,
    base_deliv_docs.intrnl_cmt_txt,
    base_deliv_docs.dlvrbl_fil_name,
    base_deliv_docs.user_id,
    base_deliv_docs.creatd_dt,
    base_deliv_docs.dltd_ind,
    base_deliv_docs.cmt_orgn_cd,
    base_deliv_docs.bdgt_ntrlty_fil_ind,
    base_deliv_docs.mntrg_rpt_fil_ind,
    base_deliv_docs.mntrg_prtcl_fil_ind,
    base_deliv_docs.proc_mntrg_rpt_ind,
    base_deliv_docs.demos_deliverable_id,
    base_deliv_docs.demos_demonstration_id,
    base_deliv_docs.demos_deliverable_type_id,
    base_deliv_docs.demos_user_id,
    base_deliv_docs.pmda_s3_file_id,
    submission_ids._internal_submission_id,
    max(submission_ids.creatd_dt)
        OVER (PARTITION BY submission_ids._internal_submission_id)
        AS _internal_submission_date
FROM
    base_deliv_docs

-- This left join should be unnecessary, but keeping it and adding a test just in case
LEFT JOIN
    submission_ids
    ON
        base_deliv_docs.mdcd_dlvrbl_fil_doc_id = submission_ids.mdcd_dlvrbl_fil_doc_id
