UPDATE
  demos_app.date_type
SET
  id = 'Draft Approval Package to Prep'
WHERE
  id = 'Draft Approval Package to Pre';

UPDATE
  demos_app.phase_date_type
SET
  date_type_id = 'Draft Approval Package to Prep'
WHERE
  date_type_id = 'Draft Approval Package to Pre';
  