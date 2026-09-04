SELECT * FROM {{ ref('cleaned_demos_app_deliverable_action_extension_request_events') }}
WHERE note IS NULL OR note = ''
