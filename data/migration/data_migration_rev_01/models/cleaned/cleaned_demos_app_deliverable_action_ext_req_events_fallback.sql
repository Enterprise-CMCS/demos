WITH fallback_user AS (
    SELECT id
    FROM
        {{ source('legacy_pmda_staged', 'final_demos_app_person') }}
    WHERE
        _legacy_users_id = 828
)

SELECT
    requested_events.id,
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
    coalesce(requested_events.user_id, fallback_user.id) AS user_id
FROM {{ ref('cleaned_demos_app_deliverable_action_ext_req_events') }} AS requested_events
INNER JOIN fallback_user
    ON
        TRUE
