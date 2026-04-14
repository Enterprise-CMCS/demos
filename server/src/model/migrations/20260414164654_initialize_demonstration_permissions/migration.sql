SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All Demonstrations', 'System'),
  ('View Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All Demonstrations'),
  ('Admin User', 'System', 'View Assigned Demonstrations'),
  ('CMS User', 'System', 'View All Demonstrations'),
  ('CMS User', 'System', 'View Assigned Demonstrations'),
  ('State User', 'System', 'View Assigned Demonstrations')
;
