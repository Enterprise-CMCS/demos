SELECT *
FROM
    {{ ref('cleaned_demos_app_deliverable_action_migration_events') }}
UNION ALL
SELECT *
FROM
    {{ ref('cleaned_demos_app_deliverable_action_submission_events') }}
