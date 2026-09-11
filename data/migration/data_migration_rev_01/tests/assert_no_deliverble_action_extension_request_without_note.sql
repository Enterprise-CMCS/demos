SELECT * FROM {{ ref('cleaned_demos_app_deliverable_action_ext_req_events') }}
WHERE note IS NULL OR note = ''
