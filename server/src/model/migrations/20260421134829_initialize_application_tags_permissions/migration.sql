SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All ApplicationTagAssignments', 'System'),
  ('View ApplicationTagAssignments on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All ApplicationTagAssignments'),
  ('Admin User', 'System', 'View ApplicationTagAssignments on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationTagAssignments'),
  ('CMS User', 'System', 'View ApplicationTagAssignments on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationTagAssignments on Assigned Demonstrations')
;
