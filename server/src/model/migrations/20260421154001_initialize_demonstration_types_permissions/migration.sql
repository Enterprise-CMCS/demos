SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All DemonstrationTypeTagAssignments', 'System'),
  ('View DemonstrationTypeTagAssignments on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All DemonstrationTypeTagAssignments'),
  ('Admin User', 'System', 'View DemonstrationTypeTagAssignments on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All DemonstrationTypeTagAssignments'),
  ('CMS User', 'System', 'View DemonstrationTypeTagAssignments on Assigned Demonstrations'),
  ('State User', 'System', 'View DemonstrationTypeTagAssignments on Assigned Demonstrations')
;
