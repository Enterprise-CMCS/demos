SET search_path TO demos_app;

ALTER TABLE demos_app.application_tag_suggestion_extract DROP CONSTRAINT application_tag_suggestion_extract_application_id_value_fkey;
ALTER TABLE demos_app.application_tag_suggestion_extract
ADD CONSTRAINT application_tag_suggestion_extract_application_id_value_fkey
FOREIGN KEY (application_id, value)
REFERENCES demos_app.application_tag_suggestion(application_id, value)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE
    demos_app.application_tag_suggestion
ADD CONSTRAINT
    check_application_tag_suggestion_non_null_replaced_value_when_replaced
CHECK (
  (
    status_id = 'Replaced'
    AND replaced_value IS NOT NULL
  ) OR (
    status_id != 'Replaced'
    AND replaced_value IS NULL
  )
);
