-- CreateTable
CREATE TABLE IF NOT EXISTS "application_tag_suggestion_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_suggestion_status_pkey" PRIMARY KEY ("id")
);

-- Seed default values
INSERT INTO "application_tag_suggestion_status" ("id")
VALUES
  ('Pending'),
  ('Accepted'),
  ('Replaced'),
  ('Removed')
;
