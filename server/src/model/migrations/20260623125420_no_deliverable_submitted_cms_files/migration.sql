ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    no_submitted_deliverable_cms_files
CHECK (
    NOT (deliverable_is_cms_attached_file = true AND deliverable_submission_action_id IS NOT NULL)
);
