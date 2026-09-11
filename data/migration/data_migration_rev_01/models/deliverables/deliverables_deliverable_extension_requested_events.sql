SELECT
    deliverable_extension.created_at AS action_timestamp,
    deliverable_extension.deliverable_id,
    'Requested Extension' AS action_type_id,
    CASE
        WHEN
            deliverable_extension.created_at > due_date_hist.dlvrbl_due_dt
            THEN 'Past Due'
        ELSE 'Upcoming'
    END AS old_status_id,
    CASE
        WHEN
            deliverable_extension.created_at > due_date_hist.dlvrbl_due_dt
            THEN 'Past Due'
        ELSE 'Upcoming'
    END AS new_status_id,
    due_date_hist.dlvrbl_due_dt AS due_date,
    due_date_hist.from_time AS _due_date_from_time,
    due_date_hist.to_time AS _due_date_to_time,
    coalesce(deliverable_extension._legacy_cmt_txt, 'Extension requested.') AS note,
    deliverable_extension.id AS active_extension_id,
    FALSE AS due_date_change_allowed,
    TRUE AS should_have_note,
    TRUE AS should_have_user_id,
    FALSE AS extension_id_optional,
    deliverable_extension._deliverable_due_date AS old_due_date,
    deliverable_extension._deliverable_due_date AS new_due_date,
    users.id AS _staged_user_id,
    deliverable_extension._legacy_rqst_user_id
FROM
    {{ ref('final_demos_app_deliverable_extension') }} AS deliverable_extension
LEFT JOIN {{ source('legacy_pmda_staged', 'final_demos_app_person') }} AS users -- noqa: RF04 
    ON
        deliverable_extension._legacy_rqst_user_id = users._legacy_users_id
LEFT JOIN
    {{ ref('deliverables_history_due_date_by_date_range') }} AS due_date_hist
    ON
        deliverable_extension._legacy_mdcd_dlvrbl_id = due_date_hist.mdcd_dlvrbl_id
        AND deliverable_extension.created_at BETWEEN due_date_hist.from_time AND due_date_hist.to_time
