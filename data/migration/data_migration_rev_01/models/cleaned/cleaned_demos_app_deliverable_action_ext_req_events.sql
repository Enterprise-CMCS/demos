SELECT
    gen_random_uuid() AS id,
    requested_events.action_timestamp,
    requested_events.deliverable_id,
    requested_events.action_type_id,
    requested_events.old_status_id,
    requested_events.new_status_id,
    requested_events.note,
    requested_events.active_extension_id,
    requested_events.due_date_change_allowed,
    requested_events.should_have_note,
    requested_events.should_have_user_id,
    requested_events.extension_id_optional,
    requested_events.old_due_date,
    requested_events.new_due_date,
    users.id AS user_id,
    requested_events._staged_user_id,
    requested_events._legacy_rqst_user_id
FROM
    {{ ref('deliverables_deliverable_extension_requested_events') }} AS requested_events
LEFT JOIN {{ source('demos_app', 'users') }} AS users -- noqa: RF04
    ON
        requested_events._staged_user_id = users.id
        AND users.person_type_id <> 'demos-cms-user'
