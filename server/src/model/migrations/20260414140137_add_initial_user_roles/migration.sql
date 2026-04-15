SET search_path TO demos_app;

INSERT INTO "role" 
VALUES 
  ('Admin User', 'System'),
  ('CMS User', 'System'),
  ('State User', 'System');

INSERT INTO "role_person_type" 
VALUES 
  ('Admin User', 'demos-admin'),
  ('CMS User', 'demos-cms-user'),
  ('State User', 'demos-state-user');
