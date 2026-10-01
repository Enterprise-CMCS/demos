-- initialize the new demonstration roles
INSERT INTO demos_app.role (id, grant_level_id) 
VALUES 
  ('Viewer', 'Demonstration'),
  ('Monitoring Lead', 'Demonstration'),
  ('HCBS Analyst', 'Demonstration'),
  ('Financial Lead', 'Demonstration')
;

-- allow new user roles (and cms user and admin) to be assigned to the new demonstration roles
INSERT INTO demos_app.role_person_type (role_id, person_type_id)
VALUES
  ('Viewer', 'demos-restricted-cms-user'),
  ('Viewer', 'demos-admin'),
  ('Viewer', 'demos-cms-user'),

  ('Monitoring Lead', 'demos-cms-reviewer-user'),
  ('Monitoring Lead', 'demos-admin'),
  ('Monitoring Lead', 'demos-cms-user'),
  
  ('HCBS Analyst', 'demos-cms-reviewer-user'),
  ('HCBS Analyst', 'demos-admin'),
  ('HCBS Analyst', 'demos-cms-user'),

  ('Financial Lead', 'demos-cms-reviewer-user'),
  ('Financial Lead', 'demos-admin'),
  ('Financial Lead', 'demos-cms-user')
;

-- at the time of writing this, there are no demos-restricted-cms-users assigned to demonstrations. But, if one does exist
-- we need to update its role assignment to the new 'Viewer' role. 
UPDATE demos_app.demonstration_role_assignment 
SET
  role_id = 'Viewer'
WHERE 
  person_type_id = 'demos-restricted-cms-user'
;

-- similarly, we do the same with the demos-cms-reviewer-user. Importantly, this default may not be factually correct, 
-- because the reviewer user can have one of three options. However, the changes have not yet been released so the loss 
-- is confined to testing data. This is simply a failsafe if such data exists on the test environments. 
UPDATE demos_app.demonstration_role_assignment
SET 
  role_id = 'Monitoring Lead'
WHERE 
  person_type_id = 'demos-cms-reviewer-user'
;

-- remove the ability for the new roles to be assigned to anything but their newly added demonstration roles
DELETE FROM demos_app.role_person_type 
WHERE
  (role_id = 'Project Officer' AND person_type_id = 'demos-restricted-cms-user')
  OR (role_id = 'DDME Analyst' AND person_type_id = 'demos-restricted-cms-user')
  OR (role_id = 'Policy Technical Director' AND person_type_id = 'demos-restricted-cms-user')
  OR (role_id = 'Monitoring & Evaluation Technical Director' AND person_type_id = 'demos-restricted-cms-user')
 
  OR (role_id = 'Project Officer' AND person_type_id = 'demos-cms-reviewer-user')
  OR (role_id = 'DDME Analyst' AND person_type_id = 'demos-cms-reviewer-user')
  OR (role_id = 'Policy Technical Director' AND person_type_id = 'demos-cms-reviewer-user')
  OR (role_id = 'Monitoring & Evaluation Technical Director' AND person_type_id = 'demos-cms-reviewer-user')
;
