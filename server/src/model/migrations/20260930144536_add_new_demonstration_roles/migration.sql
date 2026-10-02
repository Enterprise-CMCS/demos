-- initialize the new demonstration roles
INSERT INTO demos_app.role (id, grant_level_id) 
VALUES 
  ('Viewer', 'Demonstration'),
  ('Monitoring Lead', 'Demonstration'),
  ('HCBS Analyst', 'Demonstration'),
  ('Financial Lead', 'Demonstration')
ON CONFLICT (id) DO NOTHING
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
ON CONFLICT (role_id, person_type_id) DO NOTHING
;

-- at the time of writing this, there are no demos-restricted-cms-users assigned to demonstrations. But, if one does exist
-- we need to update its role assignment to the new 'Viewer' role. Because the same user can be applied multiple times to
-- the same role, we will need to account for this.  To simplify, we will default all to be non-primary

-- remove primary assignments for demos-restricted-cms-user and demos-cms-reviewer-user
with role_assignment as (
  select 
    person_id, 
    role_id, 
    demonstration_id
  from demos_app.demonstration_role_assignment
  where 
    person_type_id = 'demos-restricted-cms-user'
    OR person_type_id = 'demos-cms-reviewer-user'
)
delete from demos_app.primary_demonstration_role_assignment
using role_assignment
where primary_demonstration_role_assignment.person_id = role_assignment.person_id
  and primary_demonstration_role_assignment.role_id = role_assignment.role_id
  and primary_demonstration_role_assignment.demonstration_id = role_assignment.demonstration_id
;

-- compress existing assignments for each person-demonstration pair belonging to 'demos-restricted-cms-user's into one 
-- 'Viewer' assignment
INSERT INTO demos_app.demonstration_role_assignment (
  person_id,
  demonstration_id,
  role_id,
  state_id,
  person_type_id,
  grant_level_id
)
  SELECT DISTINCT 
    person_id, 
    demonstration_id, 
    'Viewer', 
    state_id, 
    person_type_id, 
    grant_level_id
  FROM demos_app.demonstration_role_assignment
  WHERE person_type_id = 'demos-restricted-cms-user'
;

-- remove all other role assignments for 'demos-restricted-cms-user's
DELETE FROM demos_app.demonstration_role_assignment
where person_type_id = 'demos-restricted-cms-user' and role_id <> 'Viewer'
;


-- similarly, we do the same with the demos-cms-reviewer-user. Importantly, this default may not be factually correct, 
-- because the reviewer user can have one of three options. However, the changes have not yet been released so the loss 
-- is confined to testing data. This is simply a failsafe if such data exists on the test environments. 

-- compress existing assignments for each person-demonstration pair belonging to 'demos-cms-reviewer-user's into one 
-- 'Monitoring Lead' assignment
INSERT INTO demos_app.demonstration_role_assignment (
  person_id,
  demonstration_id,
  role_id,
  state_id,
  person_type_id,
  grant_level_id
)
  SELECT DISTINCT 
    person_id, 
    demonstration_id, 
    'Monitoring Lead', 
    state_id, 
    person_type_id, 
    grant_level_id
  FROM demos_app.demonstration_role_assignment
  WHERE person_type_id = 'demos-cms-reviewer-user'
;

-- remove all other role assignments for 'demos-cms-reviewer-user's
DELETE FROM demos_app.demonstration_role_assignment
where person_type_id = 'demos-cms-reviewer-user' and role_id <> 'Monitoring Lead'
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
