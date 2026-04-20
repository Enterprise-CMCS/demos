SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All ApplicationDates', 'System'),
  ('View ApplicationDates on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All ApplicationDates'),
  ('Admin User', 'System', 'View ApplicationDates on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationDates'),
  ('CMS User', 'System', 'View ApplicationDates on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationDates on Assigned Demonstrations')
;
