WITH liz_hill AS (
    SELECT id
    FROM
        {{ ref('final_demos_app_person') }}
    WHERE
        _legacy_id = 828
)

SELECT
    gen_random_uuid() AS id,
    sub_evt.creatd_dt AS action_timestamp,
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
    '2020-01-01'::TIMESTAMPTZ AS old_due_date,
    '2020-01-01'::TIMESTAMPTZ AS new_due_date,
    liz_hill.id AS user_id
FROM
    {{ ref('deliverables_deliverable_submission_events') }} AS sub_evt
INNER JOIN
    {{ ref('final_demos_app_deliverable') }} AS f_deliv
    ON
        sub_evt.mdcd_dlvrbl_id = f_deliv._legacy_mdcd_dlvrbl_id
INNER JOIN
    liz_hill
    ON
        TRUE
