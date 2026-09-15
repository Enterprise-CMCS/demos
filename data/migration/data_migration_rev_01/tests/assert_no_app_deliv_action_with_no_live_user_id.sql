-- Warn in cases where a referenced user does not exist in demos_app and must be defaulted

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_deliv_action_with_no_live_user_id') }}
