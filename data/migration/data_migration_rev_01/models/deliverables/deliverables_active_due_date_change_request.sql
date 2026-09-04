WITH active_change_request AS (

    SELECT DISTINCT ON (deliverable.id)
        deliverable.id AS deliverable_id,
        reason_code_crosswalk.reason_code_id,
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
        deliverable.due_date AS _deliverable_due_date
    FROM {{ source('legacy_pmda_raw', 'mdcd_due_dt_chg_rqst') }} AS change_request
    LEFT JOIN {{ ref('final_demos_app_deliverable') }} AS deliverable
        ON
            change_request.mdcd_dlvrbl_id = deliverable._legacy_mdcd_dlvrbl_id
    LEFT JOIN
    -- TODO: validate where "State Level Emergency" should map. Currently pointing to "Other"
        {{ ref('crosswalk_mdcd_state_user_due_dt_chg_rsn_cd_to_reason_code') }}
            AS reason_code_crosswalk
        ON
            change_request.mdcd_state_user_due_dt_chg_rsn_cd
            = reason_code_crosswalk._legacy_mdcd_state_user_due_dt_chg_rsn_cd
    ORDER BY deliverable.id ASC, change_request.creatd_dt DESC, change_request.mdcd_due_dt_chg_rqst_id DESC
)

SELECT * FROM active_change_request
