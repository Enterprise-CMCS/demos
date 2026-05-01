SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All Users', 'System'),
  ('View Users on Assigned Demonstrations', 'System'),
  ('View My User', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All Users'),
  ('Admin User', 'System', 'View Users on Assigned Demonstrations'),
  ('Admin User', 'System', 'View My User'),
  ('CMS User', 'System', 'View All Users'),
  ('CMS User', 'System', 'View Users on Assigned Demonstrations'),
  ('CMS User', 'System', 'View My User'),
  ('State User', 'System', 'View Users on Assigned Demonstrations'),
  ('State User', 'System', 'View My User')
;
