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


-- DeferredForeignKey
ALTER TABLE "application_tag_suggestion_extract"
DROP CONSTRAINT "application_tag_suggestion_extract_suggestion_id_applicati_fkey";

ALTER TABLE "application_tag_suggestion_extract"
ADD CONSTRAINT "application_tag_suggestion_extract_suggestion_id_applicati_fkey"
FOREIGN KEY ("suggestion_id", "application_id", "value") REFERENCES "application_tag_suggestion"("id", "application_id", "value")
ON DELETE NO ACTION ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;
