WITH active_change_request AS (

    SELECT DISTINCT ON (change_request.mdcd_dlvrbl_id)
        change_request.mdcd_dlvrbl_id AS _legacy_mdcd_dlvrbl_id,
        (change_request.rqst_dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
            AS original_date_requested,
        (change_request.acptd_dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York'
            AS final_date_granted,
        change_request.creatd_dt AS created_at,
        coalesce(change_request.dtrmntn_dt, change_request.creatd_dt) AS updated_at,
        change_request.mdcd_due_dt_chg_rqst_id AS _legacy_mdcd_due_dt_chg_rqst_id,
        change_request.orgnl_dlvrbl_due_dt AS _legacy_mdcd_orgnl_dlvrbl_due_dt,
        change_request.cmt_txt AS _legacy_cmt_txt,
        change_request.rqst_user_id AS _legacy_rqst_user_id,
        change_request.mdcd_state_user_due_dt_chg_rsn_cd AS _legacy_mdcd_state_user_due_dt_chg_rsn_cd

    FROM {{ source('legacy_pmda_raw', 'mdcd_due_dt_chg_rqst') }} AS change_request

    ORDER BY
        change_request.mdcd_dlvrbl_id ASC,
        change_request.creatd_dt DESC,
        change_request.mdcd_due_dt_chg_rqst_id DESC
),

active_change_request_with_final_deliverable AS (
    SELECT
        deliverable.id AS deliverable_id,
        reason_code_crosswalk.reason_code_id,
        active_change_request.original_date_requested,
        active_change_request.final_date_granted,
        active_change_request.created_at,
        active_change_request.updated_at,
        active_change_request._legacy_mdcd_due_dt_chg_rqst_id,
        active_change_request._legacy_mdcd_orgnl_dlvrbl_due_dt,
        active_change_request._legacy_cmt_txt,
        active_change_request._legacy_rqst_user_id,
        deliverable._legacy_mdcd_dlvrbl_id,
        deliverable.due_date AS _deliverable_due_date
    FROM active_change_request
    LEFT JOIN {{ ref('final_demos_app_deliverable') }} AS deliverable
        ON
            active_change_request._legacy_mdcd_dlvrbl_id = deliverable._legacy_mdcd_dlvrbl_id
    LEFT JOIN
        {{ ref('crosswalk_mdcd_state_user_due_dt_chg_rsn_cd_to_reason_code') }}
            AS reason_code_crosswalk
        ON
            active_change_request._legacy_mdcd_state_user_due_dt_chg_rsn_cd
            = reason_code_crosswalk._legacy_mdcd_state_user_due_dt_chg_rsn_cd
)

SELECT * FROM active_change_request_with_final_deliverable
