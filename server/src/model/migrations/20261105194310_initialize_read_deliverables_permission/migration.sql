INSERT INTO demos_app.permission (id, grant_level_id) VALUES ('Read Deliverables', 'System');

-- all roles except for OACT User
INSERT INTO demos_app.role_permission (role_id, grant_level_id, permission_id)
VALUES
  ('Admin User', 'System', 'Read Deliverables'),
  ('CMS User', 'System', 'Read Deliverables'),
  ('State User', 'System', 'Read Deliverables'),
  ('Restricted CMS User', 'System', 'Read Deliverables'),
  ('CMS Reviewer User', 'System', 'Read Deliverables')
;