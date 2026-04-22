SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All ApplicationDates', 'System'),
  ('View ApplicationDates on Assigned Demonstrations', 'System'),
  ('View All ApplicationNotes', 'System'),
  ('View ApplicationNotes on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All ApplicationDates'),
  ('Admin User', 'System', 'View ApplicationDates on Assigned Demonstrations'),
  ('Admin User', 'System', 'View All ApplicationNotes'),
  ('Admin User', 'System', 'View ApplicationNotes on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationDates'),
  ('CMS User', 'System', 'View ApplicationDates on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationNotes'),
  ('CMS User', 'System', 'View ApplicationNotes on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationDates on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationNotes on Assigned Demonstrations')
;
