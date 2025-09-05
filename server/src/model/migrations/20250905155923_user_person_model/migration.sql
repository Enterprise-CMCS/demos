/*
  Warnings:

  - You are about to drop the column `display_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,person_type_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `person_type_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "demos_app"."users_cognito_subject_key";

-- AlterTable
ALTER TABLE "demos_app"."users" DROP COLUMN "display_name",
DROP COLUMN "email",
DROP COLUMN "full_name",
ADD COLUMN     "person_type_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "demos_app"."person" (
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."person_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "person_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."user_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "user_person_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_id_person_type_id_key" ON "demos_app"."person"("id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_person_type_id_key" ON "demos_app"."users"("id", "person_type_id");

-- AddForeignKey
ALTER TABLE "demos_app"."person" ADD CONSTRAINT "person_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "demos_app"."person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."users" ADD CONSTRAINT "users_id_person_type_id_fkey" FOREIGN KEY ("id", "person_type_id") REFERENCES "demos_app"."person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."users" ADD CONSTRAINT "users_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "demos_app"."user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."user_person_type_limit" ADD CONSTRAINT "user_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE OR REPLACE FUNCTION demos_app.log_changes_person()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.person_history (
            revision_type,
            id,
            person_type_id,
            email,
            full_name,
            display_name,
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
            NEW.email,
            NEW.full_name,
            NEW.display_name,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.person_history (
            revision_type,
            id,
            person_type_id,
            email,
            full_name,
            display_name,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.person_type_id,
            OLD.email,
            OLD.full_name,
            OLD.display_name,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_person_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.person
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_person();

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

