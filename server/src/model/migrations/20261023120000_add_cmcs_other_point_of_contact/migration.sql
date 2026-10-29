INSERT INTO demos_app.role (id, grant_level_id)
VALUES ('CMCS Other Point of Contact', 'Demonstration');

INSERT INTO demos_app.role_person_type (role_id, person_type_id)
VALUES
  ('CMCS Other Point of Contact', 'demos-admin'),
  ('CMCS Other Point of Contact', 'demos-cms-user');
