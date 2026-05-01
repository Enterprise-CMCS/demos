SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All People', 'System'),
  ('View People on Assigned Demonstrations', 'System'),
  ('View My Person', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All People'),
  ('Admin User', 'System', 'View People on Assigned Demonstrations'),
  ('Admin User', 'System', 'View My Person'),
  ('CMS User', 'System', 'View All People'),
  ('CMS User', 'System', 'View People on Assigned Demonstrations'),
  ('CMS User', 'System', 'View My Person'),
  ('State User', 'System', 'View People on Assigned Demonstrations'),
  ('State User', 'System', 'View My Person')
;
