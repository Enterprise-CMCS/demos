/*
  Warnings:

  - You are about to drop the column `created_at` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `permission` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `role` table. All the data in the column will be lost.
  - The primary key for the `role_permission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `permission_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_role_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_state` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_state_demonstration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_state_demonstration_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_state_history` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id,grantLevelId]` on the table `permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,grant_level_id]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grantLevelId` to the `permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grant_level_id` to the `role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grant_level_id` to the `role_permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grant_level_id` to the `role_permission_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "demos_app"."role_permission" DROP CONSTRAINT "role_permission_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."role_permission" DROP CONSTRAINT "role_permission_role_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_role" DROP CONSTRAINT "user_role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_role" DROP CONSTRAINT "user_role_user_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_state" DROP CONSTRAINT "user_state_state_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_state" DROP CONSTRAINT "user_state_user_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_demonstration_id_state_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_user_id_fkey";

-- DropForeignKey
ALTER TABLE "demos_app"."user_state_demonstration" DROP CONSTRAINT "user_state_demonstration_user_id_state_id_fkey";

-- AlterTable
ALTER TABLE "demos_app"."permission" DROP COLUMN "created_at",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "updated_at",
ADD COLUMN     "grantLevelId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."role" DROP COLUMN "created_at",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "updated_at",
ADD COLUMN     "grant_level_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demos_app"."role_permission" DROP CONSTRAINT "role_permission_pkey",
ADD COLUMN     "grant_level_id" TEXT NOT NULL,
ADD CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id", "grant_level_id", "permission_id");

-- AlterTable
ALTER TABLE "demos_app"."role_permission_history" ADD COLUMN     "grant_level_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "demos_app"."permission_history";
DROP TRIGGER "log_changes_permission_trigger" ON "demos_app"."permission";

-- DropTable
DROP TABLE "demos_app"."role_history";
DROP TRIGGER "log_changes_role_trigger" ON "demos_app"."role";

-- DropTable
DROP TABLE "demos_app"."user_role";

-- DropTable
DROP TABLE "demos_app"."user_role_history";

-- DropTable
DROP TABLE "demos_app"."user_state";

-- DropTable
DROP TABLE "demos_app"."user_state_demonstration";

-- DropTable
DROP TABLE "demos_app"."user_state_demonstration_history";

-- DropTable
DROP TABLE "demos_app"."user_state_history";

-- CreateTable
CREATE TABLE "demos_app"."grant_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "grant_level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_id_grantLevelId_key" ON "demos_app"."permission"("id", "grantLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "role_id_grant_level_id_key" ON "demos_app"."role"("id", "grant_level_id");

-- AddForeignKey
ALTER TABLE "demos_app"."permission" ADD CONSTRAINT "permission_grantLevelId_fkey" FOREIGN KEY ("grantLevelId") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role" ADD CONSTRAINT "role_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_permission" ADD CONSTRAINT "role_permission_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "demos_app"."role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_permission" ADD CONSTRAINT "role_permission_permission_id_grant_level_id_fkey" FOREIGN KEY ("permission_id", "grant_level_id") REFERENCES "demos_app"."permission"("id", "grantLevelId") ON DELETE RESTRICT ON UPDATE CASCADE;
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
            cmcs_division_id,
            signature_level_id,
            demonstration_status_id,
            state_id,
            current_phase_id,
            project_officer_user_id,
            created_at,
            updated_at
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
            NEW.cmcs_division_id,
            NEW.signature_level_id,
            NEW.demonstration_status_id,
            NEW.state_id,
            NEW.current_phase_id,
            NEW.project_officer_user_id,
            NEW.created_at,
            NEW.updated_at
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
            cmcs_division_id,
            signature_level_id,
            demonstration_status_id,
            state_id,
            current_phase_id,
            project_officer_user_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.bundle_type_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.cmcs_division_id,
            OLD.signature_level_id,
            OLD.demonstration_status_id,
            OLD.state_id,
            OLD.current_phase_id,
            OLD.project_officer_user_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_demonstration_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration();

CREATE OR REPLACE FUNCTION demos_app.log_changes_role_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            grant_level_id,
            permission_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.role_id,
            NEW.grant_level_id,
            NEW.permission_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            grant_level_id,
            permission_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.role_id,
            OLD.grant_level_id,
            OLD.permission_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_role_permission_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.role_permission
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_role_permission();

CREATE OR REPLACE FUNCTION demos_app.log_changes_users()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            person_type_id,
            cognito_subject,
            username,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.person_type_id,
            NEW.cognito_subject,
            NEW.username,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            person_type_id,
            cognito_subject,
            username,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.person_type_id,
            OLD.cognito_subject,
            OLD.username,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.users
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_users();

INSERT INTO
    "grant_level"
VALUES
    ('System'),
    ('Demonstration');

INSERT INTO
    "role"
VALUES
    ('Project Officer', 'Demonstration'),
    ('State Point of Contact', 'Demonstration'),
    ('DDME Analyst', 'Demonstration'),
    ('Policy Technical Director', 'Demonstration'),
    ('Monitoring & Evaluation Technical Director', 'Demonstration'),
    ('All Users', 'System'); -- This role is intended to be assigned to all users by default 
