/*
  Warnings:

  - You are about to drop the column `with_role_id` on the `event` table. All the data in the column will be lost.
  - You are about to drop the `event_type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `log_level_id` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_event_type_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_user_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_with_role_id_fkey";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "with_role_id",
ADD COLUMN     "active_role_id" UUID,
ADD COLUMN     "active_user_id" UUID,
ADD COLUMN     "log_level_id" TEXT NOT NULL,
ADD COLUMN     "role_id" UUID NOT NULL;

-- DropTable
DROP TABLE "event_type";

-- DropEnum
DROP TYPE "LogLevel";

-- CreateTable
CREATE TABLE "log_level" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "log_level_pkey" PRIMARY KEY ("id")
);

-- Insert Log Levels for syslog
INSERT INTO "log_level" ("id", "severity", "level")
VALUES
    ('EMERG', 'Emergency', 0),
    ('ALERT', 'Alert', 1),
    ('CRIT', 'Critical', 2),
    ('ERR', 'Error', 3),
    ('WARNING', 'Warning', 4),
    ('NOTICE', 'Notice', 5),
    ('INFO', 'Informational', 6),
    ('DEBUG', 'Debug', 7);

-- CreateTable
CREATE TABLE "reportable_event_type" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "reportable_event_type_pkey" PRIMARY KEY ("id")
);

-- Inserting expected reportable event types (this can be changed later)
INSERT INTO "reportable_event_type" ("id", "description") VALUES
-- Authentication
  ('LOGIN_SUCCEEDED', 'User logged in to the system'),
  ('LOGOUT_SUCCEEDED', 'User logged out of the system'),
-- Record Creation
  ('CREATE_DEMONSTRATION_SUCCEEDED', 'A demonstration was created'),
  ('CREATE_DEMONSTRATION_FAILED', 'Demonstration creation failed'),
  ('CREATE_EXTENSION_SUCCEEDED', 'An extension was created'),
  ('CREATE_EXTENSION_FAILED', 'Extension creation failed'),
  ('CREATE_AMENDMENT_SUCCEEDED', 'An amendment was created'),
  ('CREATE_AMENDMENT_FAILED', 'Amendment creation failed'),
-- Editing
  ('EDIT_DEMONSTRATION_SUCCEEDED', 'A demonstration was edited'),
  ('EDIT_DEMONSTRATION_FAILED', 'Demonstration editing failed'),
-- Deletion
  ('DELETE_DEMONSTRATION_SUCCEEDED', 'A demonstration was deleted'),
  ('DELETE_DEMONSTRATION_FAILED', 'Demonstration deletion failed'),
  ('DELETE_DOCUMENT_SUCCEEDED', 'A document was deleted'),
  ('DELETE_DOCUMENT_FAILED', 'Document deletion failed');

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_active_user_id_fkey" FOREIGN KEY ("active_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_active_role_id_fkey" FOREIGN KEY ("active_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_log_level_id_fkey" FOREIGN KEY ("log_level_id") REFERENCES "log_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
