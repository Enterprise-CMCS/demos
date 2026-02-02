ALTER TABLE demos_app.demonstration ADD CONSTRAINT check_demonstration_non_null_fields_when_approved CHECK (
  NOT (
    status_id = 'Approved' AND (
      effective_date IS NULL 
      OR expiration_date IS NULL 
      OR sdg_division_id IS NULL 
      OR signature_level_id IS NULL
    )
  )
);

ALTER TABLE demos_app.amendment ADD CONSTRAINT check_amendment_non_null_effective_date_when_approved CHECK (
  NOT (
    status_id = 'Approved' AND effective_date IS NULL 
  )
);

ALTER TABLE demos_app.extension ADD CONSTRAINT check_extension_non_null_effective_date_when_approved CHECK (
  NOT (
    status_id = 'Approved' AND effective_date IS NULL 
  )
);