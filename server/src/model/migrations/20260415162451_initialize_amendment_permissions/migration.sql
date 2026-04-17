SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All Amendments', 'System'),
  ('View Amendments on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All Amendments'),
  ('Admin User', 'System', 'View Amendments on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All Amendments'),
  ('CMS User', 'System', 'View Amendments on Assigned Demonstrations'),
  ('State User', 'System', 'View Amendments on Assigned Demonstrations')
;
