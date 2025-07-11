-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "event" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type_id" TEXT NOT NULL,
    "with_role_id" UUID NOT NULL,
    "route" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSON NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "log_level" "LogLevel" NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert initial event types
INSERT INTO "event_type" ("id", "description", "log_level") VALUES
-- Authentication
  ('LOGIN_SUCCEEDED', 'User logged in to the system', 'INFO'),
  ('LOGOUT_SUCCEEDED', 'User logged out of the system', 'INFO'),
-- Record Creation
  ('CREATE_DEMONSTRATION_SUCCEEDED', 'A demonstration was created', 'INFO'),
  ('CREATE_DEMONSTRATION_FAILED', 'Demonstration creation failed', 'ERROR'),
  ('CREATE_EXTENSION_SUCCEEDED', 'An extension was created', 'INFO'),
  ('CREATE_EXTENSION_FAILED', 'Extension creation failed', 'ERROR'),
  ('CREATE_AMENDMENT_SUCCEEDED', 'An amendment was created', 'INFO'),
  ('CREATE_AMENDMENT_FAILED', 'Amendment creation failed', 'ERROR'),
-- Editing
  ('EDIT_DEMONSTRATION_SUCCEEDED', 'A demonstration was edited', 'INFO'),
  ('EDIT_DEMONSTRATION_FAILED', 'Demonstration editing failed', 'ERROR'),
-- Deletion
  ('DELETE_DEMONSTRATION_SUCCEEDED', 'A demonstration was deleted', 'INFO'),
  ('DELETE_DEMONSTRATION_FAILED', 'Demonstration deletion failed', 'ERROR'),
  ('DELETE_DOCUMENT_SUCCEEDED', 'A document was deleted', 'INFO'),
  ('DELETE_DOCUMENT_FAILED', 'Document deletion failed', 'ERROR')
