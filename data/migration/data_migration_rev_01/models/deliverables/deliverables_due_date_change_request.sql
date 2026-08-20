SELECT
    deliverable.id AS deliverable_id,
    status_id,
    reason_code_id,
    original_date_requested,
    final_date_granted,
    created_at,
    updated_at,
    mdcd_state_user_due_dt_chg_rsn_cd,
    mdcd_due_dt_chg_rqst_id AS _legacy_mdcd_due_dt_chg_rqst_id
FROM {{ source('legacy_pmda_raw', 'mdcd_due_dt_chg_rqst') }} AS change_request
LEFT JOIN {{ ref('final_demos_app_deliverable') }} AS deliverable
    ON
        change_request.mdcd_dlvrbl_id = deliverable._legacy_mdcd_dlvrbl_id;


-- mdcd_due_dt_chg_rqst_id,
-- mdcd_dlvrbl_id,
-- mdcd_state_user_due_dt_chg_rsn_cd,
-- mdcd_due_dt_chg_rqst_dtrmntn_cd,
-- rqst_dlvrbl_due_dt,
-- altrnt_dlvrbl_due_dt,
-- acptd_dlvrbl_due_dt,
-- orgnl_dlvrbl_due_dt,
-- mdcd_due_dt_chg_rqst_dtl_txt,
-- mdcd_dlvrbl_open_endd_ind,
-- cmt_txt,
-- creatd_dt,
-- dltd_ind,
-- dtrmntn_dt,
-- dtrmntn_user_id,
-- rqst_user_id,
-- prvs_dlvrbl_stus_cd,
-- prvs_dlvrbl_stus_dt,
-- dlvrbl_due_dt,
-- mdcd_dlvrbl_name,
-- mdcd_dlvrbl_id,
-- mdcd_state_user_due_dt_chg_rsn_name,
