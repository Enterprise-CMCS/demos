SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All ApplicationPhases', 'System'),
  ('View ApplicationPhases on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All ApplicationPhases'),
  ('Admin User', 'System', 'View ApplicationPhases on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationPhases'),
  ('CMS User', 'System', 'View ApplicationPhases on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationPhases on Assigned Demonstrations')
;
