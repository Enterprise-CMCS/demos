SET search_path TO demos_app;

-- CreateEnum
CREATE TYPE "revision_type_enum" AS ENUM ('I', 'U', 'D');

-- CreateTable
CREATE TABLE "amendment" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)',
    "signature_level_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amendment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "clearance_level_id" TEXT NOT NULL,
    "signature_level_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "amendment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "amendment_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "amendment_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_date" (
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_pkey" PRIMARY KEY ("application_id","date_type_id")
);

-- CreateTable
CREATE TABLE "application_date_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "date_type_id" TEXT NOT NULL,
    "date_value" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_date_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_note" (
    "application_id" UUID NOT NULL,
    "note_type_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_note_pkey" PRIMARY KEY ("application_id","note_type_id")
);

-- CreateTable
CREATE TABLE "application_note_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "note_type_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_note_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_phase" (
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_pkey" PRIMARY KEY ("application_id","phase_id")
);

-- CreateTable
CREATE TABLE "application_phase_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "application_phase_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_phase_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_phase_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tag_assignment" (
    "application_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "application_tag_assignment_pkey" PRIMARY KEY ("application_id","tag_id")
);

-- CreateTable
CREATE TABLE "application_tag_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,

    CONSTRAINT "application_tag_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "application_tag_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_tag_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "application_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clearance_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "clearance_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "date_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration" (
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
    "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
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
    "clearance_level_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demonstration_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_grant_level_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_grant_level_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_role_assignment" (
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "demonstration_role_assignment_pkey" PRIMARY KEY ("person_id","demonstration_id","role_id")
);

-- CreateTable
CREATE TABLE "demonstration_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
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
CREATE TABLE "demonstration_type_tag_assignment" (
    "demonstration_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "expiration_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_type_tag_assignment_pkey" PRIMARY KEY ("demonstration_id","tag_id")
);

-- CreateTable
CREATE TABLE "demonstration_type_tag_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demonstration_id" UUID NOT NULL,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "effective_date" TIMESTAMPTZ NOT NULL,
    "expiration_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_type_tag_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demonstration_type_tag_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_type_tag_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
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
CREATE TABLE "document_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
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
CREATE TABLE "document_infected" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "infection_status" TEXT NOT NULL,
    "infection_threats" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_infected_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_infected_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "infection_status" TEXT NOT NULL,
    "infection_threats" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_infected_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "document_pending_upload" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_pending_upload_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "application_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_pending_upload_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "document_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "document_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
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
CREATE TABLE "event_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension" (
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "clearance_level_id" TEXT NOT NULL DEFAULT 'CMS (OSORA)',
    "signature_level_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "application_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "effective_date" TIMESTAMPTZ,
    "status_id" TEXT NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "clearance_level_id" TEXT NOT NULL,
    "signature_level_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "extension_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "extension_application_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "extension_application_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "grant_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_level" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "log_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "note_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
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
CREATE TABLE "person_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
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
CREATE TABLE "person_state" (
    "person_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "person_state_pkey" PRIMARY KEY ("person_id","state_id")
);

-- CreateTable
CREATE TABLE "person_state_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "person_state_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "person_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "person_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase" (
    "id" TEXT NOT NULL,
    "phase_number" INTEGER NOT NULL,

    CONSTRAINT "phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_date_type" (
    "phase_id" TEXT NOT NULL,
    "date_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_date_type_pkey" PRIMARY KEY ("phase_id","date_type_id")
);

-- CreateTable
CREATE TABLE "phase_document_type" (
    "phase_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_document_type_pkey" PRIMARY KEY ("phase_id","document_type_id")
);

-- CreateTable
CREATE TABLE "phase_note_type" (
    "phase_id" TEXT NOT NULL,
    "note_type_id" TEXT NOT NULL,

    CONSTRAINT "phase_note_type_pkey" PRIMARY KEY ("phase_id","note_type_id")
);

-- CreateTable
CREATE TABLE "phase_phase_status" (
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,

    CONSTRAINT "phase_phase_status_pkey" PRIMARY KEY ("phase_id","phase_status_id")
);

-- CreateTable
CREATE TABLE "phase_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "phase_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_demonstration_role_assignment" (
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "primary_demonstration_role_assignment_pkey" PRIMARY KEY ("demonstration_id","role_id")
);

-- CreateTable
CREATE TABLE "primary_demonstration_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "primary_demonstration_role_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","grant_level_id","permission_id")
);

-- CreateTable
CREATE TABLE "role_permission_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "role_person_type" (
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,

    CONSTRAINT "role_person_type_pkey" PRIMARY KEY ("role_id","person_type_id")
);

-- CreateTable
CREATE TABLE "sdg_division" (
    "id" TEXT NOT NULL,

    CONSTRAINT "sdg_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_level" (
    "id" TEXT NOT NULL,

    CONSTRAINT "signature_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_grant_level_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "system_grant_level_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_role_assignment" (
    "person_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "system_role_assignment_pkey" PRIMARY KEY ("person_id","role_id")
);

-- CreateTable
CREATE TABLE "system_role_assignment_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "grant_level_id" TEXT NOT NULL,

    CONSTRAINT "system_role_assignment_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "tag_configuration" (
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_configuration_pkey" PRIMARY KEY ("tag_id","tag_type_id")
);

-- CreateTable
CREATE TABLE "tag_configuration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tag_id" TEXT NOT NULL,
    "tag_type_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tag_configuration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "tag_configuration_source" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_configuration_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_configuration_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_configuration_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "tag_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "person_type_id" TEXT NOT NULL,
    "cognito_subject" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
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
CREATE TABLE "user_person_type_limit" (
    "id" TEXT NOT NULL,

    CONSTRAINT "user_person_type_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "amendment_id_application_type_id_key" ON "amendment"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_id_application_type_id_key" ON "application"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_state_id_key" ON "demonstration"("id", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_application_type_id_key" ON "demonstration"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "extension_id_application_type_id_key" ON "extension"("id", "application_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_id_grant_level_id_key" ON "permission"("id", "grant_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_id_person_type_id_key" ON "person"("id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "phase_phase_number_key" ON "phase"("phase_number");

-- CreateIndex
CREATE UNIQUE INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key" ON "primary_demonstration_role_assignment"("person_id", "demonstration_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_id_grant_level_id_key" ON "role"("id", "grant_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_person_type_id_key" ON "users"("id", "person_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_subject_key" ON "users"("cognito_subject");

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "amendment_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment" ADD CONSTRAINT "amendment_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amendment_application_type_limit" ADD CONSTRAINT "amendment_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_date" ADD CONSTRAINT "application_date_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_date" ADD CONSTRAINT "application_date_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "note_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_phase" ADD CONSTRAINT "application_phase_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_phase" ADD CONSTRAINT "application_phase_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "application_phase_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_phase" ADD CONSTRAINT "application_phase_phase_id_phase_status_id_fkey" FOREIGN KEY ("phase_id", "phase_status_id") REFERENCES "phase_phase_status"("phase_id", "phase_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_phase_type_limit" ADD CONSTRAINT "application_phase_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_tag_id_tag_type_id_fkey" FOREIGN KEY ("tag_id", "tag_type_id") REFERENCES "tag_configuration"("tag_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_assignment" ADD CONSTRAINT "application_tag_assignment_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "application_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tag_type_limit" ADD CONSTRAINT "application_tag_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "demonstration_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_sdg_division_id_fkey" FOREIGN KEY ("sdg_division_id") REFERENCES "sdg_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_application_type_limit" ADD CONSTRAINT "demonstration_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_grant_level_limit" ADD CONSTRAINT "demonstration_grant_level_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_person_id_state_id_fkey" FOREIGN KEY ("person_id", "state_id") REFERENCES "person_state"("person_id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_person_id_person_type_id_fkey" FOREIGN KEY ("person_id", "person_type_id") REFERENCES "person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_demonstration_id_state_id_fkey" FOREIGN KEY ("demonstration_id", "state_id") REFERENCES "demonstration"("id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_role_id_person_type_id_fkey" FOREIGN KEY ("role_id", "person_type_id") REFERENCES "role_person_type"("role_id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_role_assignment" ADD CONSTRAINT "demonstration_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demonstration_grant_level_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_tag_id_tag_type_id_fkey" FOREIGN KEY ("tag_id", "tag_type_id") REFERENCES "tag_configuration"("tag_id", "tag_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_assignment" ADD CONSTRAINT "demonstration_type_tag_assignment_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "demonstration_type_tag_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_type_tag_type_limit" ADD CONSTRAINT "demonstration_type_tag_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_infected" ADD CONSTRAINT "document_infected_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_phase_id_document_type_id_fkey" FOREIGN KEY ("phase_id", "document_type_id") REFERENCES "phase_document_type"("phase_id", "document_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_log_level_id_fkey" FOREIGN KEY ("log_level_id") REFERENCES "log_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_id_application_type_id_fkey" FOREIGN KEY ("id", "application_type_id") REFERENCES "application"("id", "application_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_application_type_id_fkey" FOREIGN KEY ("application_type_id") REFERENCES "extension_application_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_clearance_level_id_fkey" FOREIGN KEY ("clearance_level_id") REFERENCES "clearance_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension" ADD CONSTRAINT "extension_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_application_type_limit" ADD CONSTRAINT "extension_application_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "application_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_state" ADD CONSTRAINT "person_state_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_state" ADD CONSTRAINT "person_state_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_date_type" ADD CONSTRAINT "phase_date_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_date_type" ADD CONSTRAINT "phase_date_type_date_type_id_fkey" FOREIGN KEY ("date_type_id") REFERENCES "date_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_document_type" ADD CONSTRAINT "phase_document_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_document_type" ADD CONSTRAINT "phase_document_type_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_note_type" ADD CONSTRAINT "phase_note_type_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_note_type" ADD CONSTRAINT "phase_note_type_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "note_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_phase_status" ADD CONSTRAINT "phase_phase_status_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_phase_status" ADD CONSTRAINT "phase_phase_status_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey" FOREIGN KEY ("person_id", "demonstration_id", "role_id") REFERENCES "demonstration_role_assignment"("person_id", "demonstration_id", "role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_grant_level_id_fkey" FOREIGN KEY ("permission_id", "grant_level_id") REFERENCES "permission"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_person_type" ADD CONSTRAINT "role_person_type_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_person_type" ADD CONSTRAINT "role_person_type_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_grant_level_limit" ADD CONSTRAINT "system_grant_level_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "grant_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_person_id_person_type_id_fkey" FOREIGN KEY ("person_id", "person_type_id") REFERENCES "person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_role_id_person_type_id_fkey" FOREIGN KEY ("role_id", "person_type_id") REFERENCES "role_person_type"("role_id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "role"("id", "grant_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "system_grant_level_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_tag_type_id_fkey" FOREIGN KEY ("tag_type_id") REFERENCES "tag_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "tag_configuration_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_configuration" ADD CONSTRAINT "tag_configuration_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "tag_configuration_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_person_type_id_fkey" FOREIGN KEY ("id", "person_type_id") REFERENCES "person"("id", "person_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_person_type_id_fkey" FOREIGN KEY ("person_type_id") REFERENCES "user_person_type_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_person_type_limit" ADD CONSTRAINT "user_person_type_limit_id_fkey" FOREIGN KEY ("id") REFERENCES "person_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
