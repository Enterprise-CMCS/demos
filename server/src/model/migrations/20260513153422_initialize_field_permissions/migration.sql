insert into permission (id, grant_level_id) values 
  ('View All SystemRoleAssignments', 'System'),
  ('View My SystemRoleAssignments', 'System'),

  ('Access CMS-Only Fields', 'System'),
  ('Access CMS-Only Queries', 'System'),
  ('Access CMS-Only Mutations', 'System')
;


INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All SystemRoleAssignments'),
  ('Admin User', 'System', 'View My SystemRoleAssignments'),
  ('CMS User', 'System', 'View All SystemRoleAssignments'),
  ('CMS User', 'System', 'View My SystemRoleAssignments'),
  ('State User', 'System', 'View My SystemRoleAssignments'),

  ('Admin User', 'System', 'Access CMS-Only Fields'),
  ('Admin User', 'System', 'Access CMS-Only Queries'),
  ('Admin User', 'System', 'Access CMS-Only Mutations'),
  ('CMS User', 'System', 'Access CMS-Only Fields'),
  ('CMS User', 'System', 'Access CMS-Only Queries'),
  ('CMS User', 'System', 'Access CMS-Only Mutations'),
;
