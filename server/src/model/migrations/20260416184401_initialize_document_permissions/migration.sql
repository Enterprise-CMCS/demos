SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All Documents', 'System'),
  ('View Documents on Assigned Demonstrations', 'System'),
  ('View Owned Documents', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All Documents'),
  ('Admin User', 'System', 'View Documents on Assigned Demonstrations'),
  ('Admin User', 'System', 'View Owned Documents'),
  ('CMS User', 'System', 'View All Documents'),
  ('CMS User', 'System', 'View Documents on Assigned Demonstrations'),
  ('CMS User', 'System', 'View Owned Documents'),
  ('State User', 'System', 'View Documents on Assigned Demonstrations'),
  ('State User', 'System', 'View Owned Documents')
;
