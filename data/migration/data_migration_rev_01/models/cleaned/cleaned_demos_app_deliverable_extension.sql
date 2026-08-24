SELECT
    gen_random_uuid() AS id,
    deliverable_extension.deliverable_id,
    deliverable_extension.status_id,
    deliverable_extension.reason_code_id,
    deliverable_extension.original_date_requested,
    deliverable_extension.final_date_granted,
    deliverable_extension.created_at,
    deliverable_extension.updated_at,
    deliverable_extension._legacy_mdcd_state_user_due_dt_chg_rsn_cd,
    deliverable_extension._legacy_mdcd_due_dt_chg_rqst_id,
    deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt,
    deliverable_extension._legacy_cmt_txt,
    deliverable_extension._legacy_rqst_user_id,
    deliverable_extension._legacy_dtrmntn_dt,
    deliverable_extension._deliverable_due_date
FROM {{ ref('deliverables_due_date_change_request') }} AS deliverable_extension
WHERE
    deliverable_extension._legacy_mdcd_due_dt_chg_rqst_id NOT IN (
        SELECT e1._legacy_mdcd_due_dt_chg_rqst_id
        FROM {{ ref('errors_deliverable_extension_with_no_reason_code') }} AS e1
    )
    AND deliverable_extension._legacy_mdcd_due_dt_chg_rqst_id NOT IN (
        SELECT e2._legacy_mdcd_due_dt_chg_rqst_id
        FROM {{ ref('errors_deliverable_extension_with_no_deliverable') }} AS e2
    )
    AND deliverable_extension._legacy_mdcd_due_dt_chg_rqst_id NOT IN (
        SELECT e3._legacy_mdcd_due_dt_chg_rqst_id
        FROM {{ ref('errors_deliverable_extension_with_no_original_date_requested') }} AS e3
    )
