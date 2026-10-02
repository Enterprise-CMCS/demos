-- initialize the new demonstration roles
INSERT INTO demos_app.role (id, grant_level_id) 
VALUES 
  ('Viewer', 'Demonstration'),
  ('Monitoring Lead', 'Demonstration'),
  ('HCBS Analyst', 'Demonstration'),
  ('Financial Lead', 'Demonstration')
ON CONFLICT (id) DO NOTHING -- normally discouraged, but previous failed migration run requires this be idempotent
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
ON CONFLICT (role_id, person_type_id) DO NOTHING -- normally discouraged, but previous failed migration run requires this be idempotent
;

-- at the time of writing this, there are no demos-restricted-cms-users nor demos-cms-reviewer-users assigned to 
-- demonstrations. But, if one does exist we need to update its role assignment to an applicable demonstration role. 

-- stage the existing role assignments for demos-restricted-cms-users and demos-cms-reviewer-users. Defaulting these to 
-- not be primary
CREATE TEMPORARY TABLE viewers AS
SELECT DISTINCT
    person_id,
    demonstration_id,
    state_id,
    person_type_id
FROM
    demos_app.demonstration_role_assignment
WHERE
    person_type_id IN ('demos-restricted-cms-user', 'demos-cms-reviewer-user')
;

-- clear existing assignments for these users
DELETE FROM demos_app.primary_demonstration_role_assignment
USING
    viewers
WHERE
    primary_demonstration_role_assignment.person_id = viewers.person_id
    AND primary_demonstration_role_assignment.demonstration_id = viewers.demonstration_id;

DELETE FROM demos_app.demonstration_role_assignment
USING
    viewers
WHERE
    demonstration_role_assignment.person_id = viewers.person_id
    AND demonstration_role_assignment.demonstration_id = viewers.demonstration_id;

-- repopulate role assignments for the staged users
INSERT INTO demos_app.demonstration_role_assignment (
    person_id,
    demonstration_id,
    role_id,
    state_id,
    person_type_id,
    grant_level_id
)
SELECT
    person_id,
    demonstration_id,
    'Viewer' AS role_id,
    state_id,
    person_type_id,
    'Demonstration' AS grant_level_id
FROM
    viewers
WHERE
    person_type_id = 'demos-restricted-cms-user';

INSERT INTO demos_app.demonstration_role_assignment (
    person_id,
    demonstration_id,
    role_id,
    state_id,
    person_type_id,
    grant_level_id
)
SELECT
    person_id,
    demonstration_id,
    'Monitoring Lead' AS role_id, -- defaulting to 'Monitoring Lead' for 'demos-cms-reviewer-users'
    state_id,
    person_type_id,
    'Demonstration' AS grant_level_id
FROM
    viewers
WHERE
    person_type_id = 'demos-cms-reviewer-user';

DROP TABLE viewers;

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
