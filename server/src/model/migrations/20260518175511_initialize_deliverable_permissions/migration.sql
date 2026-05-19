SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All Deliverables', 'System'),
  ('View Deliverables on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All Deliverables'),
  ('Admin User', 'System', 'View Deliverables on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All Deliverables'),
  ('CMS User', 'System', 'View Deliverables on Assigned Demonstrations'),
  ('State User', 'System', 'View Deliverables on Assigned Demonstrations')
;
