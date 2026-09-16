SELECT *
FROM {{ ref('cleaned_demos_app_deliverable_docs') }}
WHERE
    NOT deliverable_is_cms_attached_file AND deliverable_submission_action_id IS NULL
