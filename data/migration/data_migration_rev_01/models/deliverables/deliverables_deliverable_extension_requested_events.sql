-- logic
-- we can use the recorded 'orgnl_dlvrbl_due_dt' against the creation date to determine the status.
-- For creating an extension request, the status does not change.


SELECT
    deliverable_extension.created_at AS action_timestamp,
    deliverable_extension.deliverable_id,
    'Requested Extension' AS action_type_id,
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
    gen_random_uuid() AS active_extension_id, -- TODO
    FALSE AS due_date_change_allowed,
    TRUE AS should_have_note,
    TRUE AS should_have_user_id,
    FALSE AS extension_id_optional,
    coalesce(
        (deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
        deliverable_extension._deliverable_due_date
    ) AS old_due_date,
    coalesce(
        (deliverable_extension._legacy_mdcd_orgnl_dlvrbl_due_dt + TIME '23:59:59.999') AT TIME ZONE 'America/New_York',
        deliverable_extension._deliverable_due_date
    ) AS new_due_date,
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
