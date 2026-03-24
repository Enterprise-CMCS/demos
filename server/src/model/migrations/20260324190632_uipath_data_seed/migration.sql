SET search_path TO demos_app;

-- Seed default values
INSERT INTO "application_tag_suggestion_status" ("id")
VALUES
  ('Pending'),
  ('Accepted'),
  ('Replaced'),
  ('Removed');

-- Seed default values
INSERT INTO "application_tag_suggestion_extract_field_limit" ("id")
VALUES
  ('demo_type');
