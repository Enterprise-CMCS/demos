SELECT * FROM {{ ref('cleaned_demos_app_deliverable_action_ext_req_events') }}
WHERE user_id IS NULL
