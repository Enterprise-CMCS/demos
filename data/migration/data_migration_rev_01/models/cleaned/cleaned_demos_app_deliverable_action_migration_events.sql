SELECT
    migration_event.id,
    migration_event.action_timestamp,
    migration_event.deliverable_id,
    migration_event.action_type_id,
    migration_event.old_status_id,
    migration_event.new_status_id,
    migration_event.note,
    migration_event.active_extension_id,
    migration_event.due_date_change_allowed,
    migration_event.should_have_note,
    migration_event.should_have_user_id,
    migration_event.extension_id_optional,
    migration_event.old_due_date,
    migration_event.new_due_date,
    migration_event.user_id
FROM {{ ref('deliverables_deliverable_action_migration_events') }} AS migration_event
