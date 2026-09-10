WITH liz_hill AS (
    SELECT id
    FROM
        {{ source('legacy_pmda_staged', 'final_demos_app_person') }}
    WHERE
        _legacy_users_id = 828
),

submission_event AS (
    SELECT
        gen_random_uuid() AS id,
        sub_evt._internal_submission_date AS action_timestamp,
        f_deliv.id AS deliverable_id,
        'Submitted Deliverable' AS action_type_id,
        'Submitted' AS old_status_id,
        'Submitted' AS new_status_id,
        NULL AS note,
        NULL::UUID AS active_extension_id,
        FALSE AS due_date_change_allowed,
        FALSE AS should_have_note,
        TRUE AS should_have_user_id,
        TRUE AS extension_id_optional,
        coalesce(due_date_hist.dlvrbl_due_dt, f_deliv.due_date) AS old_due_date,
        coalesce(due_date_hist.dlvrbl_due_dt, f_deliv.due_date) AS new_due_date,
        coalesce(sub_evt.demos_user_id, liz_hill.id) AS user_id,
        sub_evt._internal_submission_id
    FROM
        {{ ref('deliverables_deliverable_submission_events') }} AS sub_evt

    LEFT JOIN
        {{ ref('deliverables_history_due_date_by_date_range') }} AS due_date_hist
        ON
            sub_evt._legacy_mdcd_dlvrbl_id = due_date_hist.mdcd_dlvrbl_id
            AND sub_evt._internal_submission_date BETWEEN due_date_hist.from_time AND due_date_hist.to_time

    -- Inner join acceptable here; we want actions for all the final deliverables
    INNER JOIN
        {{ ref('final_demos_app_deliverable') }} AS f_deliv
        ON
            sub_evt._legacy_mdcd_dlvrbl_id = f_deliv._legacy_mdcd_dlvrbl_id

    -- Just putting the ID on every row
    INNER JOIN
        liz_hill
        ON
            TRUE
)

SELECT
    submission_event.id,
    submission_event.action_timestamp,
    submission_event.deliverable_id,
    submission_event.action_type_id,
    submission_event.old_status_id,
    submission_event.new_status_id,
    submission_event.note,
    deliverable_extension.id AS active_extension_id,
    submission_event.due_date_change_allowed,
    submission_event.should_have_note,
    submission_event.should_have_user_id,
    submission_event.extension_id_optional,
    submission_event.old_due_date,
    submission_event.new_due_date,
    submission_event.user_id,
    submission_event._internal_submission_id
FROM submission_event LEFT JOIN {{ ref('final_demos_app_deliverable_extension') }} AS deliverable_extension
    ON
        submission_event.deliverable_id = deliverable_extension.deliverable_id
        AND submission_event.action_timestamp > deliverable_extension.created_at
