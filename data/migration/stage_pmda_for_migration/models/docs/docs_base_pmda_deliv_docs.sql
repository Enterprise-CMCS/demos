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
    f_demo.id AS demos_demonstration_id,
    f_person.id AS demos_user_id
FROM
    {{ source('legacy_pmda_raw', 'mdcd_dlvrbl_fil_doc') }} AS deliv_doc
LEFT JOIN
    {{ ref('final_demos_app_deliverable') }} AS f_deliv
    ON
        deliv_doc.mdcd_dlvrbl_id = f_deliv._legacy_mdcd_dlvrbl_id
LEFT JOIN
    {{ ref('final_demos_app_demonstration') }} AS f_demo
    ON
        f_deliv._legacy_mdcd_demo_id = f_demo._legacy_mdcd_demo_id
LEFT JOIN
    {{ ref('final_demos_app_person') }} AS f_person
    ON
        deliv_doc.user_id = f_person._legacy_users_id
WHERE
    deliv_doc.dltd_ind = 0
