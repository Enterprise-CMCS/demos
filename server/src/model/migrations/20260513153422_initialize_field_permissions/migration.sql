DELETE FROM "role_person_type"
WHERE 
  role_id = 'All Users'
;

DELETE FROM "role" 
WHERE 
  id = 'All Users'
;

insert into permission (id, grant_level_id) values 
  ('View All SystemRoleAssignments', 'System'),
  ('View My SystemRoleAssignments', 'System'),

  ('Access CMS Field', 'System'),
  ('Access CMS Query', 'System'),
  ('Perform CMS Action', 'System'),
  ('Perform State Action', 'System')
;


INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All SystemRoleAssignments'),
  ('Admin User', 'System', 'View My SystemRoleAssignments'),
  ('CMS User', 'System', 'View All SystemRoleAssignments'),
  ('CMS User', 'System', 'View My SystemRoleAssignments'),
  ('State User', 'System', 'View My SystemRoleAssignments'),

  ('Admin User', 'System', 'Access CMS Field'),
  ('Admin User', 'System', 'Access CMS Query'),
  ('Admin User', 'System', 'Perform CMS Action'),
  ('Admin User', 'System', 'Perform State Action'),
  ('CMS User', 'System', 'Access CMS Field'),
  ('CMS User', 'System', 'Access CMS Query'),
  ('CMS User', 'System', 'Perform CMS Action'),
  ('State User', 'System', 'Perform State Action')
;



