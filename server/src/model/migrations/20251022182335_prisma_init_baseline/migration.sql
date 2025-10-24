-- CreateEnum
CREATE TYPE "demos_app"."revision_type_enum" AS ENUM ('I', 'U', 'D');

-- CreateTable
CREATE TABLE "demos_app"."amendment" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."amendment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amendment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."amendment_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "amendment_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."application" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_date" (
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_pkey" PRIMARY KEY ("application_id","date_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_date_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_phase" (
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_pkey" PRIMARY KEY ("application_id","phase_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_phase_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."application_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."date_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "date_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "sdg_division_id" TEXT,
    "signature_level_id" TEXT,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "sdg_division_id" TEXT,
    "signature_level_id" TEXT,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_grant_level_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_grant_level_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_role_assignment" (
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "demonstration_role_assignment_pkey" PRIMARY KEY ("person_id","demonstration_id","role_id")
);

-- CreateTable
CREATE TABLE "demos_app"."demonstration_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "demonstration_role_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."document" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."document_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."document_pending_upload" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."document_pending_upload_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."document_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."event" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "role_id" TEXT,
    "application_id" UUID,
    "event_type_id" TEXT NOT NULL,
    "log_level_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSON NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."event_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."extension" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."extension_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "expiration_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "extension_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."extension_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "extension_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."grant_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "grant_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."log_level" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "log_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."permission" (
    "id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."person" (
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."person_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "person_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."person_state" (
    "person_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "person_state_pkey" PRIMARY KEY ("person_id","state_id")
);

-- CreateTable
CREATE TABLE "demos_app"."person_state_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "person_state_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."person_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "person_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."phase" (
    "id" TEXT NOT NULL,
    "phase_number" INTEGER NOT NULL,

    CONSTRAINT "phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."phase_date_type" (
    "phase_id" TEXT NOT NULL,
    "date_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_date_type_pkey" PRIMARY KEY ("phase_id","date_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."phase_document_type" (
    "phase_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_document_type_pkey" PRIMARY KEY ("phase_id","document_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."phase_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "phase_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."primary_demonstration_role_assignment" (
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "primary_demonstration_role_assignment_pkey" PRIMARY KEY ("demonstration_id","role_id")
);

-- CreateTable
CREATE TABLE "demos_app"."primary_demonstration_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "primary_demonstration_role_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."role" (
    "id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."role_permission" (
    "role_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","grant_level_id","permission_id")
);

-- CreateTable
CREATE TABLE "demos_app"."role_permission_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."role_person_type" (
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,

    CONSTRAINT "role_person_type_pkey" PRIMARY KEY ("role_id","person_type_id")
);

-- CreateTable
CREATE TABLE "demos_app"."sdg_division" (
    "id" TEXT NOT NULL,

    CONSTRAINT "sdg_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."signature_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "signature_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."state" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."system_grant_level_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "system_grant_level_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."system_role_assignment" (
    "person_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "system_role_assignment_pkey" PRIMARY KEY ("person_id","role_id")
);

-- CreateTable
CREATE TABLE "demos_app"."system_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "system_role_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."users" (
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "cognito_subject" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos_app"."users_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "demos_app"."revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "cognito_subject" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demos_app"."user_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "user_person_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amendment_id_application_type_id_key" ON "demos_app"."amendment"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_id_application_type_id_key" ON "demos_app"."application"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_state_id_key" ON "demos_app"."demonstration"("id", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_application_type_id_key" ON "demos_app"."demonstration"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "extension_id_application_type_id_key" ON "demos_app"."extension"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_id_grant_level_id_key" ON "demos_app"."permission"("id", "grant_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_id_person_type_id_key" ON "demos_app"."person"("id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "phase_phase_number_key" ON "demos_app"."phase"("phase_number");

-- CreateIndex
CREATE UNIQUE INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key" ON "demos_app"."primary_demonstration_role_assignment"("person_id", "demonstration_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_id_grant_level_id_key" ON "demos_app"."role"("id", "grant_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_person_type_id_key" ON "demos_app"."users"("id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_subject_key" ON "demos_app"."users"("cognito_subject");

-- AddForeignKey
ALTER TABLE "demos_app"."amendment" ADD CONSTRAINT "amendment_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "demos_app"."application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."amendment" ADD CONSTRAINT "amendment_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."amendment_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."amendment" ADD CONSTRAINT "amendment_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demos_app"."demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."amendment" ADD CONSTRAINT "amendment_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."amendment" ADD CONSTRAINT "amendment_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."amendment_application_type_limit" ADD CONSTRAINT "amendment_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application" ADD CONSTRAINT "application_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_date" ADD CONSTRAINT "application_date_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_date" ADD CONSTRAINT "application_date_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."application_phase" ADD CONSTRAINT "application_phase_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "demos_app"."phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "demos_app"."application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."demonstration_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_sdg_division_id_fkey" FOREIGN KEY ("sdg_division_id") REFERENCES "demos_app"."sdg_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "demos_app"."signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT "demonstration_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "demos_app"."state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_application_type_limit" ADD CONSTRAINT "demonstration_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_grant_level_limit" ADD CONSTRAINT "demonstration_grant_level_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_person_id_state_id_fkey" FOREIGN KEY ("person_id", "state_id") REFERENCES "demos_app"."person_state"("person_id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_person_id_person_type_id_fkey" FOREIGN KEY ("person_id", "person_type_id") REFERENCES "demos_app"."person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_demonstration_id_state_id_fkey" FOREIGN KEY ("demonstration_id", "state_id") REFERENCES "demos_app"."demonstration"("id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_role_id_person_type_id_fkey" FOREIGN KEY ("role_id", "person_type_id") REFERENCES "demos_app"."role_person_type"("role_id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "demos_app"."role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."demonstration_grant_level_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document" ADD CONSTRAINT "document_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "demos_app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document" ADD CONSTRAINT "document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document" ADD CONSTRAINT "document_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "demos_app"."phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document_pending_upload" ADD CONSTRAINT "document_pending_upload_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "demos_app"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document_pending_upload" ADD CONSTRAINT "document_pending_upload_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."document_pending_upload" ADD CONSTRAINT "document_pending_upload_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "demos_app"."phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."event" ADD CONSTRAINT "event_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "demos_app"."role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "demos_app"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."event" ADD CONSTRAINT "event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "demos_app"."application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."event" ADD CONSTRAINT "event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "demos_app"."event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."event" ADD CONSTRAINT "event_log_level_id_fkey" FOREIGN KEY ("log_level_id") REFERENCES "demos_app"."log_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension" ADD CONSTRAINT "extension_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "demos_app"."application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension" ADD CONSTRAINT "extension_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demos_app"."extension_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension" ADD CONSTRAINT "extension_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demos_app"."demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension" ADD CONSTRAINT "extension_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "demos_app"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension" ADD CONSTRAINT "extension_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."extension_application_type_limit" ADD CONSTRAINT "extension_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."permission" ADD CONSTRAINT "permission_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."person" ADD CONSTRAINT "person_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "demos_app"."person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."person_state" ADD CONSTRAINT "person_state_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "demos_app"."person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."person_state" ADD CONSTRAINT "person_state_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "demos_app"."state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_date_type" ADD CONSTRAINT "phase_date_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_date_type" ADD CONSTRAINT "phase_date_type_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "demos_app"."date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_document_type" ADD CONSTRAINT "phase_document_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "demos_app"."phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."phase_document_type" ADD CONSTRAINT "phase_document_type_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "demos_app"."document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey" FOREIGN KEY ("person_id", "demonstration_id", "role_id") REFERENCES "demos_app"."demonstration_role_assignment"("person_id", "demonstration_id", "role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role" ADD CONSTRAINT "role_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_permission" ADD CONSTRAINT "role_permission_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "demos_app"."role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_permission" ADD CONSTRAINT "role_permission_permission_id_grant_level_id_fkey" FOREIGN KEY ("permission_id", "grant_level_id") REFERENCES "demos_app"."permission"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_person_type" ADD CONSTRAINT "role_person_type_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "demos_app"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."role_person_type" ADD CONSTRAINT "role_person_type_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "demos_app"."person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_grant_level_limit" ADD CONSTRAINT "system_grant_level_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_person_id_person_type_id_fkey" FOREIGN KEY ("person_id", "person_type_id") REFERENCES "demos_app"."person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_role_id_person_type_id_fkey" FOREIGN KEY ("role_id", "person_type_id") REFERENCES "demos_app"."role_person_type"("role_id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "demos_app"."role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."system_grant_level_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."users" ADD CONSTRAINT "users_id_person_type_id_fkey" FOREIGN KEY ("id", "person_type_id") REFERENCES "demos_app"."person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."users" ADD CONSTRAINT "users_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "demos_app"."user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."user_person_type_limit" ADD CONSTRAINT "user_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "demos_app"."person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
