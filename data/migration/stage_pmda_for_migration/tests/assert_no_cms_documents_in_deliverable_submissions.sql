SELECT *
FROM
    {{ ref('final_demos_app_document') }}
WHERE
    deliverable_submission_action_id IS NOT NULL AND deliverable_is_cms_attached_file
