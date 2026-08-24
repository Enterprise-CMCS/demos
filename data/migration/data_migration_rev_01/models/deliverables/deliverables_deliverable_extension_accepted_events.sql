SELECT
    deliverable_extension._legacy_dtrmntn_dt AS action_timestamp,
    deliverable_extension.deliverable_id,
    'Approved Extension Request' AS action_type_id,
    CASE
        WHEN
            deliverable_extension.created_at > deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt
            THEN 'Past Due'
        ELSE 'Upcoming'
    END AS old_status_id,
    CASE
        WHEN
            deliverable_extension.created_at > deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt
            THEN 'Past Due'
        ELSE 'Upcoming'
    END AS new_status_id,
    deliverable_extension._legacy_cmt_txt AS note,
    NULL::UUID AS active_extension_id,
    TRUE AS due_date_change_allowed,
    FALSE AS should_have_note,
    TRUE AS should_have_user_id,
    FALSE AS extension_id_optional,
    deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt AS old_due_date,
    deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt AS new_due_date,
    users.id AS user_id
FROM
    {{ ref('final_demos_app_deliverable_extension') }} AS deliverable_extension
LEFT JOIN {{ source('legacy_pmda_staged', 'final_demos_app_person') }} AS users -- noqa: RF04 
    ON
        deliverable_extension._legacy_rqst_user_id = users._legacy_users_id

-- TODO ON MONDAY:
-- im seeing that some deliverables have an absurd number of extension request (max: 34??). ill wnant to validate
-- also need to figure out logic with active extension request. In theory, this cannot be non-null 
-- since you cannot create an extension request is one is already active... but who knows.  it at least seems that way?
-- extension accepted events
-- extension denied events
