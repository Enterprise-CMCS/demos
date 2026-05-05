SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All DemonstrationRoleAssignments', 'System'),
  ('View DemonstrationRoleAssignments on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All DemonstrationRoleAssignments'),
  ('Admin User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All DemonstrationRoleAssignments'),
  ('CMS User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
  ('State User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations')
;
