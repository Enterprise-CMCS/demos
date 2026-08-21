SELECT
    deliverable.id AS deliverable_id,
    coalesce(status_crosswalk.status_id, 'Requested') AS status_id,
    reason_code_crosswalk.reason_code_id,
    change_request.rqst_dlvrbl_due_dt::TIMESTAMPTZ AS original_date_requested,
    change_request.acptd_dlvrbl_due_dt::TIMESTAMPTZ AS final_date_granted,
    change_request.creatd_dt AS created_at,
    coalesce(change_request.dtrmntn_dt, change_request.creatd_dt) AS updated_at,
    change_request.mdcd_state_user_due_dt_chg_rsn_cd AS _legacy_mdcd_state_user_due_dt_chg_rsn_cd,
    change_request.mdcd_due_dt_chg_rqst_id AS _legacy_mdcd_due_dt_chg_rqst_id,
    change_request.orgnl_dlvrbl_due_dt::TIMESTAMPTZ AS _legacy_mdcd_orgnl_dlvrbl_due_dt
FROM {{ source('legacy_pmda_raw', 'mdcd_due_dt_chg_rqst') }} AS change_request
LEFT JOIN {{ ref('final_demos_app_deliverable') }} AS deliverable
    ON
        change_request.mdcd_dlvrbl_id = deliverable._legacy_mdcd_dlvrbl_id
LEFT JOIN
    {{ ref('crosswalk_mdcd_state_user_due_dt_chg_rsn_cd_to_reason_code') }}
        AS reason_code_crosswalk
    ON
        change_request.mdcd_state_user_due_dt_chg_rsn_cd
        = reason_code_crosswalk._legacy_mdcd_state_user_due_dt_chg_rsn_cd
-- TODO: validate where "State Level Emergency" should map. Currently pointing to "Other"
LEFT JOIN {{ ref('crosswalk_mdcd_due_dt_chg_rqst_dtrmntn_cd_to_status_id') }} AS status_crosswalk
    ON
        change_request.mdcd_due_dt_chg_rqst_dtrmntn_cd
        = status_crosswalk._legacy_mdcd_due_dt_chg_rqst_dtrmntn_cd
