/*
  Warnings:

  - You are about to drop the column `created_at` on the `bundle_type` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `bundle_type` table. All the data in the column will be lost.
  - You are about to drop the column `evaluation_period_end_date` on the `demonstration` table. All the data in the column will be lost.
  - You are about to drop the column `evaluation_period_start_date` on the `demonstration` table. All the data in the column will be lost.
  - You are about to drop the column `evaluation_period_end_date` on the `demonstration_history` table. All the data in the column will be lost.
  - You are about to drop the column `evaluation_period_start_date` on the `demonstration_history` table. All the data in the column will be lost.
  - The primary key for the `demonstration_status` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `permission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role_permission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `state` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `state_code` on the `state` table. All the data in the column will be lost.
  - You are about to drop the column `state_name` on the `state` table. All the data in the column will be lost.
  - The primary key for the `user_role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_state` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_state_demonstration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `bundle_type_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `demonstration_bundle_type_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `state_history` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `effective_date` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiration_date` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effective_date` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiration_date` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `document_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `document_type_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `reportable_event_type` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `state` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "demonstration" DROP CONSTRAINT "demonstration_demonstration_status_id_fkey";

-- DropForeignKey
ALTER TABLE "demonstration" DROP CONSTRAINT "demonstration_state_id_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_with_role_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_state" DROP CONSTRAINT "user_state_state_id_fkey";

-- DropForeignKey
ALTER TABLE "user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_demonstration_id_state_id_fkey";

-- DropForeignKey
ALTER TABLE "user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_user_id_state_id_fkey";

-- AlterTable
ALTER TABLE "bundle_type" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "demonstration" DROP COLUMN "evaluation_period_end_date",
DROP COLUMN "evaluation_period_start_date",
ADD COLUMN     "effective_date" DATE NOT NULL,
ADD COLUMN     "expiration_date" DATE NOT NULL,
ALTER COLUMN "demonstration_status_id" SET DATA TYPE TEXT,
ALTER COLUMN "state_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "demonstration_history" DROP COLUMN "evaluation_period_end_date",
DROP COLUMN "evaluation_period_start_date",
ADD COLUMN     "effective_date" DATE NOT NULL,
ADD COLUMN     "expiration_date" DATE NOT NULL,
ALTER COLUMN "demonstration_status_id" SET DATA TYPE TEXT,
ALTER COLUMN "state_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "demonstration_status" DROP CONSTRAINT "demonstration_status_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "demonstration_status_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "demonstration_status_history" ALTER COLUMN "id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "document_type" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "document_type_history" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "with_role_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "permission" DROP CONSTRAINT "permission_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "permission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permission_history" ALTER COLUMN "id" SET DATA TYPE TEXT;

-- Empty this table to facilitate changes
TRUNCATE TABLE "reportable_event_type";

-- AlterTable
ALTER TABLE "reportable_event_type" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "role" DROP CONSTRAINT "role_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_history" ALTER COLUMN "id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_pkey",
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ALTER COLUMN "permission_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id", "permission_id");

-- AlterTable
ALTER TABLE "role_permission_history" ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ALTER COLUMN "permission_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "state" DROP CONSTRAINT "state_pkey",
DROP COLUMN "state_code",
DROP COLUMN "state_name",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "state_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey",
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id", "role_id");

-- AlterTable
ALTER TABLE "user_role_history" ALTER COLUMN "role_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_state" DROP CONSTRAINT "user_state_pkey",
ALTER COLUMN "state_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_state_pkey" PRIMARY KEY ("user_id", "state_id");

-- AlterTable
ALTER TABLE "user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_pkey",
ALTER COLUMN "state_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "user_state_demonstration_pkey" PRIMARY KEY ("user_id", "state_id", "demonstration_id");

-- AlterTable
ALTER TABLE "user_state_demonstration_history" ALTER COLUMN "state_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_state_history" ALTER COLUMN "state_id" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "bundle_type_history";

-- DropTable
DROP TABLE "demonstration_bundle_type_history";

-- DropTable
DROP TABLE "state_history";

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state" ADD CONSTRAINT "user_state_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_demonstration" ADD CONSTRAINT "user_state_demonstration_user_id_state_id_fkey" FOREIGN KEY ("user_id", "state_id") REFERENCES "user_state"("user_id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_demonstration" ADD CONSTRAINT "user_state_demonstration_demonstration_id_state_id_fkey" FOREIGN KEY ("demonstration_id", "state_id") REFERENCES "demonstration"("id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "demonstration_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop triggers for removed history tables
DROP TRIGGER log_changes_state_trigger ON demos_app.state;
DROP FUNCTION demos_app.log_changes_state;
DROP TRIGGER log_changes_bundle_type_trigger ON demos_app.bundle_type;
DROP FUNCTION demos_app.log_changes_bundle_type;
DROP TRIGGER log_changes_demonstration_bundle_type_trigger ON demos_app.demonstration_bundle_type;
DROP FUNCTION demos_app.log_changes_demonstration_bundle_type;

-- Reinserting expected reportable event types (this can be changed later)
INSERT INTO "reportable_event_type" (id, name, description) VALUES
-- Authentication
  ('LOGIN_SUCCEEDED', 'Login Succeeded', 'User logged in to the system'),
  ('LOGOUT_SUCCEEDED', 'Logout Succeeded', 'User logged out of the system'),
-- Record Creation
  ('CREATE_DEMONSTRATION_SUCCEEDED', 'Create Demonstration Succeeded', 'A demonstration was created'),
  ('CREATE_DEMONSTRATION_FAILED', 'Create Demonstration Failed', 'Demonstration creation failed'),
  ('CREATE_EXTENSION_SUCCEEDED', 'Create Extension Succeeded', 'An extension was created'),
  ('CREATE_EXTENSION_FAILED', 'Create Extension Failed', 'Extension creation failed'),
  ('CREATE_AMENDMENT_SUCCEEDED', 'Create Amendment Succeeded', 'An amendment was created'),
  ('CREATE_AMENDMENT_FAILED', 'Create Amendment Failed', 'Amendment creation failed'),
-- Editing
  ('EDIT_DEMONSTRATION_SUCCEEDED', 'Edit Demonstration Succeeded', 'A demonstration was edited'),
  ('EDIT_DEMONSTRATION_FAILED', 'Edit Demonstration Failed', 'Demonstration editing failed'),
-- Deletion
  ('DELETE_DEMONSTRATION_SUCCEEDED', 'Delete Demonstration Succeeded', 'A demonstration was deleted'),
  ('DELETE_DEMONSTRATION_FAILED', 'Delete Demonstration Failed', 'Demonstration deletion failed'),
  ('DELETE_DOCUMENT_SUCCEEDED', 'Delete Document Succeeded', 'A document was deleted'),
  ('DELETE_DOCUMENT_FAILED', 'Delete Document Failed', 'Document deletion failed');

CREATE OR REPLACE FUNCTION demos_app.log_changes_document_type()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_type_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_type_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_type_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document_type
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document_type();

CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_history (
            revision_type,
            id,
            bundle_type_id,
            name,
            description,
            effective_date,
            expiration_date,
            created_at,
            updated_at,
            demonstration_status_id,
            state_id,
            project_officer_user_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.bundle_type_id,
            NEW.name,
            NEW.description,
            NEW.effective_date,
            NEW.expiration_date,
            NEW.created_at,
            NEW.updated_at,
            NEW.demonstration_status_id,
            NEW.state_id,
            NEW.project_officer_user_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.demonstration_history (
            revision_type,
            id,
            bundle_type_id,
            name,
            description,
            effective_date,
            expiration_date,
            created_at,
            updated_at,
            demonstration_status_id,
            state_id,
            project_officer_user_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.bundle_type_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.created_at,
            OLD.updated_at,
            OLD.demonstration_status_id,
            OLD.state_id,
            OLD.project_officer_user_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_demonstration_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration();
