ALTER TABLE demos_app.amendment DROP CONSTRAINT IF EXISTS check_amendment_non_null_effective_date_when_approved;
ALTER TABLE demos_app.amendment ADD CONSTRAINT check_amendment_non_null_fields_when_approved CHECK (
  NOT (
    status_id = 'Approved'
    AND (
      effective_date IS NULL
      OR signature_level_id IS NULL
    ) 
  )
);

ALTER TABLE demos_app.extension DROP CONSTRAINT IF EXISTS check_extension_non_null_effective_date_when_approved;
ALTER TABLE demos_app.extension ADD CONSTRAINT check_extension_non_null_fields_when_approved CHECK (
  NOT (
    status_id = 'Approved'
    AND (
      effective_date IS NULL
      OR signature_level_id IS NULL
    ) 
  )
);
