ALTER TABLE demos_app.document_pending_upload ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.document_pending_upload ADD CONSTRAINT check_non_empty_description CHECK (trim(description) != '');
