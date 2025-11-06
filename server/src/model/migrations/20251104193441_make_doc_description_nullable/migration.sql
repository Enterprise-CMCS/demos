-- Drop checks
ALTER TABLE demos_app.document DROP CONSTRAINT check_non_empty_description;
ALTER TABLE demos_app.document_pending_upload DROP CONSTRAINT check_non_empty_description;
