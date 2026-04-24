SET search_path TO demos_app;

INSERT INTO "permission" 
VALUES 
  ('View All ApplicationTagSuggestions', 'System'),
  ('View ApplicationTagSuggestions on Assigned Demonstrations', 'System')
;

INSERT INTO "role_permission" 
VALUES 
  ('Admin User', 'System', 'View All ApplicationTagSuggestions'),
  ('Admin User', 'System', 'View ApplicationTagSuggestions on Assigned Demonstrations'),
  ('CMS User', 'System', 'View All ApplicationTagSuggestions'),
  ('CMS User', 'System', 'View ApplicationTagSuggestions on Assigned Demonstrations'),
  ('State User', 'System', 'View ApplicationTagSuggestions on Assigned Demonstrations')
;
