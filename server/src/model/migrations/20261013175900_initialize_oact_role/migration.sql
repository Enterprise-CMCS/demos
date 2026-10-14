INSERT INTO demos_app.person_type (id) VALUES ('demos-oact-user');

INSERT INTO demos_app.user_person_type_limit (id) VALUES ('demos-oact-user');

INSERT INTO demos_app.role (id, grant_level_id) 
VALUES 
  ('OACT User', 'System'), 
  ('OACT Lead', 'Demonstration')
;

INSERT INTO demos_app.role_person_type (role_id, person_type_id) VALUES 
('OACT User', 'demos-oact-user'),

('OACT Lead', 'demos-oact-user'),
('OACT Lead', 'demos-admin'),
('OACT Lead', 'demos-cms-user')
;

-- copy all permission from Restricted CMS User to OACT User
INSERT INTO demos_app.role_permission (role_id, grant_level_id, permission_id)
SELECT 'OACT User', grant_level_id, permission_id
FROM demos_app.role_permission
WHERE role_id = 'Restricted CMS User';
