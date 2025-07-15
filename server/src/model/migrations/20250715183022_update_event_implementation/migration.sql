/*
  Warnings:

  - Added the required column `updated_at` to the `event_type` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `log_level` on the `event_type` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "log_level" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_with_role_id_fkey";

-- AlterTable
ALTER TABLE "event_type" ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
DROP COLUMN "log_level",
ADD COLUMN     "log_level" "log_level" NOT NULL;

-- DropEnum
DROP TYPE "LogLevel";

-- CreateTable
CREATE TABLE "event_type_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "log_level" "log_level" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "event_type_history_pkey" PRIMARY KEY ("revision_id")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION demos_app.log_changes_event_type()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.event_type_history (
            revision_type,
            id,
            description,
            log_level,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.description,
            NEW.log_level,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.event_type_history (
            revision_type,
            id,
            description,
            log_level,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.description,
            OLD.log_level,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_event_type_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.event_type
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_event_type();

-- Re-insert initial event types
INSERT INTO "event_type" ("id", "description", "log_level", "updated_at") VALUES
-- Authentication
  ('LOGIN_SUCCEEDED', 'User logged in to the system', 'INFO', CURRENT_TIMESTAMP),
  ('LOGOUT_SUCCEEDED', 'User logged out of the system', 'INFO', CURRENT_TIMESTAMP),
-- Record Creation
  ('CREATE_DEMONSTRATION_SUCCEEDED', 'A demonstration was created', 'INFO', CURRENT_TIMESTAMP),
  ('CREATE_DEMONSTRATION_FAILED', 'Demonstration creation failed', 'ERROR', CURRENT_TIMESTAMP),
  ('CREATE_EXTENSION_SUCCEEDED', 'An extension was created', 'INFO', CURRENT_TIMESTAMP),
  ('CREATE_EXTENSION_FAILED', 'Extension creation failed', 'ERROR', CURRENT_TIMESTAMP),
  ('CREATE_AMENDMENT_SUCCEEDED', 'An amendment was created', 'INFO', CURRENT_TIMESTAMP),
  ('CREATE_AMENDMENT_FAILED', 'Amendment creation failed', 'ERROR', CURRENT_TIMESTAMP),
-- Editing
  ('EDIT_DEMONSTRATION_SUCCEEDED', 'A demonstration was edited', 'INFO', CURRENT_TIMESTAMP),
  ('EDIT_DEMONSTRATION_FAILED', 'Demonstration editing failed', 'ERROR', CURRENT_TIMESTAMP),
-- Deletion
  ('DELETE_DEMONSTRATION_SUCCEEDED', 'A demonstration was deleted', 'INFO', CURRENT_TIMESTAMP),
  ('DELETE_DEMONSTRATION_FAILED', 'Demonstration deletion failed', 'ERROR', CURRENT_TIMESTAMP),
  ('DELETE_DOCUMENT_SUCCEEDED', 'A document was deleted', 'INFO', CURRENT_TIMESTAMP),
  ('DELETE_DOCUMENT_FAILED', 'Document deletion failed', 'ERROR', CURRENT_TIMESTAMP)
