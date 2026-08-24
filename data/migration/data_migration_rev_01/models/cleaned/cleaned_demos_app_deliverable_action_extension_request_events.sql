SELECT
    gen_random_uuid() AS id,
    action_timestamp,
    deliverable_id,
    action_type_id,
    old_status_id,
    new_status_id,
    note,
    active_extension_id,
    due_date_change_allowed,
    should_have_note,
    should_have_user_id,
    extension_id_optional,
    old_due_date,
    new_due_date,
    user_id
FROM
    {{ ref('deliverables_deliverable_extension_requested_events') }}
