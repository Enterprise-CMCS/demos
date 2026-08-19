SELECT
    gen_random_uuid() AS id,
    current_timestamp AS action_timestamp,
    id AS deliverable_id,
    'Migrated Deliverable From PMDA' AS action_type_id,
    status_id AS old_status_id,
    status_id AS new_status_id,
    NULL AS note,
    NULL::UUID AS active_extension_id,
    FALSE AS due_date_change_allowed,
    FALSE AS should_have_note,
    FALSE AS should_have_user_id,
    TRUE AS extension_id_optional,
    due_date AS old_due_date,
    due_date AS new_due_date,
    NULL::UUID AS user_id
FROM
    {{ ref('final_demos_app_deliverable') }}
