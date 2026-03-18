SET search_path TO demos_app;

-- CreateTable
CREATE TABLE IF NOT EXISTS "application_tag_suggestion_extract_field_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_suggestion_extract_field_limit_pkey" PRIMARY KEY ("id")
);

-- Seed default values
INSERT INTO
    "application_tag_suggestion_extract_field_limit"
VALUES
  ('demo_type')
