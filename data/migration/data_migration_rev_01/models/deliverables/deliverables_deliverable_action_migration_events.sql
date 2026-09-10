SELECT
    gen_random_uuid() AS id,
    current_timestamp AS action_timestamp,
    deliverable.id AS deliverable_id,
    'Migrated Deliverable From PMDA' AS action_type_id,
    deliverable.status_id AS old_status_id,
    deliverable.status_id AS new_status_id,
    NULL AS note,
    deliverable_extension.id AS active_extension_id,
    FALSE AS due_date_change_allowed,
    FALSE AS should_have_note,
    FALSE AS should_have_user_id,
    TRUE AS extension_id_optional,
    deliverable.due_date AS old_due_date,
    deliverable.due_date AS new_due_date,
    NULL::UUID AS user_id
FROM
    {{ ref('final_demos_app_deliverable') }} AS deliverable
LEFT JOIN {{ ref('final_demos_app_deliverable_extension') }} AS deliverable_extension
    ON
        deliverable.id = deliverable_extension.deliverable_id
