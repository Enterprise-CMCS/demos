INSERT INTO demos_app.person_type (id) VALUES ('demos-cms-reviewer-user');

INSERT INTO demos_app.user_person_type_limit (id) VALUES ('demos-cms-reviewer-user');

INSERT INTO demos_app.role (id, grant_level_id) VALUES ('CMS Reviewer User', 'System');

INSERT INTO demos_app.role_person_type (role_id, person_type_id) VALUES 
('CMS Reviewer User', 'demos-cms-reviewer-user'),
('Project Officer', 'demos-cms-reviewer-user'),
('DDME Analyst', 'demos-cms-reviewer-user'),
('Policy Technical Director', 'demos-cms-reviewer-user'),
('Monitoring & Evaluation Technical Director', 'demos-cms-reviewer-user');

UPDATE demos_app.permission 
SET id = 'Edit Documents on Assigned Deliverables'
WHERE id = 'Edit State Documents on Assigned Deliverables';

UPDATE demos_app.permission 
SET id = 'Delete Documents on Assigned Deliverables'
WHERE id = 'Delete State Documents on Assigned Deliverables';

/*
 * Existing field-level permissions "Perform CMS Action" and "Perform State Action" were replaced
 * with more granular permissions for CMS and State actions.  Two existing row-level permissions simply renamed.
 * Appropriate permissions assigned to new 'CMS Reviewer User' role.
 */

INSERT INTO demos_app.permission (id, grant_level_id) VALUES
('Modify Applications', 'System'),
('Modify Deliverables', 'System'),
('Create Public Comment', 'System'),
('Submit Deliverables', 'System'),
('Request Deliverable Extensions', 'System'),
('Modify Documents', 'System'),
('Modify Deliverable CMS Documents', 'System'),
('Modify Deliverable State Documents', 'System');

INSERT INTO demos_app.role_permission (role_id, grant_level_id, permission_id) VALUES
-- grant all new permissions to admins
('Admin User', 'System', 'Modify Applications'),
('Admin User', 'System', 'Modify Deliverables'),
('Admin User', 'System', 'Create Public Comment'),
('Admin User', 'System', 'Submit Deliverables'),
('Admin User', 'System', 'Request Deliverable Extensions'),
('Admin User', 'System', 'Modify Documents'),
('Admin User', 'System', 'Modify Deliverable CMS Documents'),
('Admin User', 'System', 'Modify Deliverable State Documents'),

-- grant all new permissions, except 'Request Deliverable Extensions' to CMS Users
('CMS User', 'System', 'Modify Applications'),
('CMS User', 'System', 'Modify Deliverables'),
('CMS User', 'System', 'Create Public Comment'),
('CMS User', 'System', 'Submit Deliverables'),
('CMS User', 'System', 'Modify Documents'),
('CMS User', 'System', 'Modify Deliverable CMS Documents'),
('CMS User', 'System', 'Modify Deliverable State Documents'),

-- grant new permissions which replaced 'Perform State Action' to State Users
('State User', 'System', 'Create Public Comment'),
('State User', 'System', 'Submit Deliverables'),
('State User', 'System', 'Request Deliverable Extensions'),
('State User', 'System', 'Modify Deliverable State Documents'),

-- grant all field-level permissions, except for admin permissions and 'Modify Applications' to CMS Reviewer Users
('CMS Reviewer User', 'System', 'Modify Deliverables'),
('CMS Reviewer User', 'System', 'Create Public Comment'),
('CMS Reviewer User', 'System', 'Submit Deliverables'),
('CMS Reviewer User', 'System', 'Modify Deliverable CMS Documents'),
('CMS Reviewer User', 'System', 'Modify Deliverable State Documents'),
('CMS Reviewer User', 'System', 'Access CMS Field'),
('CMS Reviewer User', 'System', 'Access CMS Query'),
('CMS Reviewer User', 'System', 'Generate On-Demand Report'),

-- grant all row-level permissions to CMS Reviewer Users
('CMS Reviewer User', 'System', 'View All Demonstrations'),
('CMS Reviewer User', 'System', 'View Assigned Demonstrations'),
('CMS Reviewer User', 'System', 'View All Amendments'),
('CMS Reviewer User', 'System', 'View Amendments on Assigned Demonstrations'),
('CMS Reviewer User', 'System', 'View All Extensions'),
('CMS Reviewer User', 'System', 'View Extensions on Assigned Demonstrations'),
('CMS Reviewer User', 'System', 'View All Documents'),
('CMS Reviewer User', 'System', 'Edit All Documents'),
('CMS Reviewer User', 'System', 'Delete All Documents'),
('CMS Reviewer User', 'System', 'View Documents on Assigned Deliverables'),
('CMS Reviewer User', 'System', 'View All Deliverables'),
('CMS Reviewer User', 'System', 'View Deliverables on Assigned Demonstrations'),
('CMS Reviewer User', 'System', 'View All DemonstrationRoleAssignments'),
('CMS Reviewer User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations');

-- remove replaced permissions
DELETE FROM demos_app.role_permission
WHERE permission_id IN (
  'Perform CMS Action',
  'Perform State Action'
);

DELETE FROM demos_app.permission
WHERE id IN (
  'Perform CMS Action',
  'Perform State Action'
);

DELETE FROM demos_app.permission WHERE id IN ('Perform CMS Action', 'Perform State Action');



