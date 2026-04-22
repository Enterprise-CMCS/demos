SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All DeliverableDemonstrationTypes', 'System'),
  ('View DeliverableDemonstrationTypes on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All DeliverableDemonstrationTypes'),
  ('Admin User', 'System', 'View DeliverableDemonstrationTypes on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All DeliverableDemonstrationTypes'),
  ('CMS User', 'System', 'View DeliverableDemonstrationTypes on Assigned Demonstrations'),
  ('State User', 'System', 'View DeliverableDemonstrationTypes on Assigned Demonstrations')
;
