-- CreateEnum
CREATE TYPE "revision_type_enum" AS ENUM ('I', 'U', 'D');

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "role_permission_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permission_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "user_role_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_role_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "user_state" (
    "user_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "user_state_pkey" PRIMARY KEY ("user_id","state_id")
);

-- CreateTable
CREATE TABLE "user_state_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,

    CONSTRAINT "user_state_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "user_state_demonstration" (
    "user_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,

    CONSTRAINT "user_state_demonstration_pkey" PRIMARY KEY ("user_id","state_id","demonstration_id")
);

-- CreateTable
CREATE TABLE "user_state_demonstration_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "state_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,

    CONSTRAINT "user_state_demonstration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "bundle" (
    "id" UUID NOT NULL,
    "bundle_type_id" TEXT NOT NULL,

    CONSTRAINT "bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "bundle_type_id" TEXT NOT NULL,

    CONSTRAINT "bundle_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "bundle_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "bundle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmcs_division" (
    "id" TEXT NOT NULL,

    CONSTRAINT "cmcs_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration" (
    "id" UUID NOT NULL,
    "bundle_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effective_date" DATE,
    "expiration_date" DATE,
    "cmcs_division_id" TEXT,
    "signature_level_id" TEXT,
    "demonstration_status_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "project_officer_user_id" UUID NOT NULL,
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
    "bundle_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effective_date" DATE,
    "expiration_date" DATE,
    "cmcs_division_id" TEXT,
    "signature_level_id" TEXT,
    "demonstration_status_id" TEXT NOT NULL,
    "state_id" TEXT NOT NULL,
    "project_officer_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demonstration_bundle_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_bundle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_status_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demonstration_status_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
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
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "s3_path" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "document_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "document_pending_upload" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
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
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "bundle_id" UUID NOT NULL,
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
    "with_role_id" TEXT,
    "event_type" TEXT NOT NULL,
    "log_level" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_data" JSON NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modification" (
    "id" UUID NOT NULL,
    "bundle_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effective_date" DATE,
    "expiration_date" DATE,
    "modification_status_id" TEXT NOT NULL,
    "project_officer_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "modification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modification_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "bundle_type_id" TEXT NOT NULL,
    "demonstration_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effective_date" DATE,
    "expiration_date" DATE,
    "modification_status_id" TEXT NOT NULL,
    "project_officer_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "modification_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "modification_bundle_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "modification_bundle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modification_status" (
    "id" TEXT NOT NULL,
    "bundle_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "modification_status_pkey" PRIMARY KEY ("id","bundle_type_id")
);

-- CreateTable
CREATE TABLE "modification_status_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "bundle_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "modification_status_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "permission_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "reportable_event_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "reportable_event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "role_history_pkey" PRIMARY KEY ("revision_id")
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
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "cognito_subject" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
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
    "cognito_subject" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_id_bundle_type_id_key" ON "bundle"("id", "bundle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_state_id_key" ON "demonstration"("id", "state_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_bundle_type_id_key" ON "demonstration"("id", "bundle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_subject_key" ON "users"("cognito_subject");

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state" ADD CONSTRAINT "user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state" ADD CONSTRAINT "user_state_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_demonstration" ADD CONSTRAINT "user_state_demonstration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_demonstration" ADD CONSTRAINT "user_state_demonstration_user_id_state_id_fkey" FOREIGN KEY ("user_id", "state_id") REFERENCES "user_state"("user_id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state_demonstration" ADD CONSTRAINT "user_state_demonstration_demonstration_id_state_id_fkey" FOREIGN KEY ("demonstration_id", "state_id") REFERENCES "demonstration"("id", "state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle" ADD CONSTRAINT "bundle_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_id_bundle_type_id_fkey" FOREIGN KEY ("id", "bundle_type_id") REFERENCES "bundle"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "demonstration_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_demonstration_status_id_fkey" FOREIGN KEY ("demonstration_status_id") REFERENCES "demonstration_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_project_officer_user_id_fkey" FOREIGN KEY ("project_officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_cmcs_division_id_fkey" FOREIGN KEY ("cmcs_division_id") REFERENCES "cmcs_division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_signature_level_id_fkey" FOREIGN KEY ("signature_level_id") REFERENCES "signature_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_bundle_type" ADD CONSTRAINT "demonstration_bundle_type_id_fkey" FOREIGN KEY ("id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_pending_upload" ADD CONSTRAINT "document_pending_upload_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_with_role_id_fkey" FOREIGN KEY ("with_role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_id_bundle_type_id_fkey" FOREIGN KEY ("id", "bundle_type_id") REFERENCES "bundle"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "modification_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_modification_status_id_bundle_type_id_fkey" FOREIGN KEY ("modification_status_id", "bundle_type_id") REFERENCES "modification_status"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_project_officer_user_id_fkey" FOREIGN KEY ("project_officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification_bundle_type" ADD CONSTRAINT "modification_bundle_type_id_fkey" FOREIGN KEY ("id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification_status" ADD CONSTRAINT "modification_status_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "modification_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add history tables
CREATE OR REPLACE FUNCTION demos_app.log_changes_role_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            permission_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.role_id,
            NEW.permission_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            permission_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.role_id,
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

CREATE OR REPLACE FUNCTION demos_app.log_changes_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.user_role_history (
            revision_type,
            user_id,
            role_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.user_id,
            NEW.role_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.user_role_history (
            revision_type,
            user_id,
            role_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.user_id,
            OLD.role_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_user_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.user_role
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_user_role();

CREATE OR REPLACE FUNCTION demos_app.log_changes_user_state()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.user_state_history (
            revision_type,
            user_id,
            state_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.user_id,
            NEW.state_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.user_state_history (
            revision_type,
            user_id,
            state_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.user_id,
            OLD.state_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_user_state_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.user_state
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_user_state();

CREATE OR REPLACE FUNCTION demos_app.log_changes_user_state_demonstration()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.user_state_demonstration_history (
            revision_type,
            user_id,
            state_id,
            demonstration_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.user_id,
            NEW.state_id,
            NEW.demonstration_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.user_state_demonstration_history (
            revision_type,
            user_id,
            state_id,
            demonstration_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.user_id,
            OLD.state_id,
            OLD.demonstration_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_user_state_demonstration_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.user_state_demonstration
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_user_state_demonstration();

CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_history (
            revision_type,
            id,
            bundle_type_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.bundle_type_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.bundle_history (
            revision_type,
            id,
            bundle_type_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.bundle_type_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_bundle_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle();

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

CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_status_history (
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
        INSERT INTO demos_app.demonstration_status_history (
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

CREATE OR REPLACE TRIGGER log_changes_demonstration_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration_status
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration_status();

CREATE OR REPLACE FUNCTION demos_app.log_changes_document()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            title,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            bundle_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.title,
            NEW.description,
            NEW.s3_path,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.bundle_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            title,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            bundle_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.title,
            OLD.description,
            OLD.s3_path,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.bundle_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document();

CREATE OR REPLACE FUNCTION demos_app.log_changes_document_pending_upload()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            title,
            description,
            owner_user_id,
            document_type_id,
            bundle_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.title,
            NEW.description,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.bundle_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            title,
            description,
            owner_user_id,
            document_type_id,
            bundle_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.title,
            OLD.description,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.bundle_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_pending_upload_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document_pending_upload
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document_pending_upload();

CREATE OR REPLACE FUNCTION demos_app.log_changes_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.modification_history (
            revision_type,
            id,
            bundle_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            modification_status_id,
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
            NEW.demonstration_id,
            NEW.name,
            NEW.description,
            NEW.effective_date,
            NEW.expiration_date,
            NEW.modification_status_id,
            NEW.project_officer_user_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.modification_history (
            revision_type,
            id,
            bundle_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            modification_status_id,
            project_officer_user_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.bundle_type_id,
            OLD.demonstration_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.modification_status_id,
            OLD.project_officer_user_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_modification_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.modification
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_modification();

CREATE OR REPLACE FUNCTION demos_app.log_changes_modification_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.modification_status_history (
            revision_type,
            id,
            bundle_type_id,
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
            NEW.bundle_type_id,
            NEW.name,
            NEW.description,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.modification_status_history (
            revision_type,
            id,
            bundle_type_id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.bundle_type_id,
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

CREATE OR REPLACE TRIGGER log_changes_modification_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.modification_status
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_modification_status();

CREATE OR REPLACE FUNCTION demos_app.log_changes_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.permission_history (
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
        INSERT INTO demos_app.permission_history (
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

CREATE OR REPLACE TRIGGER log_changes_permission_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.permission
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_permission();

CREATE OR REPLACE FUNCTION demos_app.log_changes_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.role_history (
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
        INSERT INTO demos_app.role_history (
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

CREATE OR REPLACE TRIGGER log_changes_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.role
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_role();

CREATE OR REPLACE FUNCTION demos_app.log_changes_users()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            cognito_subject,
            username,
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
            NEW.cognito_subject,
            NEW.username,
            NEW.email,
            NEW.full_name,
            NEW.display_name,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            cognito_subject,
            username,
            email,
            full_name,
            display_name,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.cognito_subject,
            OLD.username,
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

CREATE OR REPLACE TRIGGER log_changes_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.users
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_users();

-- Insert standard values for tables / keys
INSERT INTO bundle_type (id, name, description)
VALUES
    ('DEMONSTRATION', 'Demonstration', 'Demonstration bundle type.'),
    ('AMENDMENT', 'Amendment', 'Amendment bundle type.'),
    ('EXTENSION', 'Extension', 'Extension bundle type.');

INSERT INTO demonstration_bundle_type (id)
VALUES
    ('DEMONSTRATION');

INSERT INTO modification_bundle_type (id)
VALUES
    ('AMENDMENT'),
    ('EXTENSION');

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

INSERT INTO "cmcs_division" ("id")
VALUES
    ('Division of System Reform Demonstrations'),
    ('Division of Eligibility and Coverage Demonstrations');

INSERT INTO "signature_level" ("id")
VALUES
    ('OA'),
    ('OCD'),
    ('OGD');

INSERT INTO "document_type" ("id")
VALUES
    ('Application Completeness Letter'),
    ('Approval Letter'),
    ('Final BN Worksheet'),
    ('Final Budget Neutrality Formulation Workbook'),
    ('Formal OMB Policy Concurrence Email'),
    ('General File'),
    ('Internal Completeness Review Form'),
    ('Payment Ratio Analysis'),
    ('Pre-Submission'),
    ('Q&A'),
    ('Signed Decision Memo'),
    ('State Application');

CREATE OR REPLACE PROCEDURE
demos_app.move_document_from_processing_to_clean(
    p_id UUID,
    p_s3_path TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (SELECT id FROM demos_app.document_pending_upload WHERE id = p_id) THEN
        RAISE EXCEPTION 'No document_pending_upload found for id: %', p_id;
    END IF;

    INSERT INTO demos_app.document (
        id,
        title,
        description,
        s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
        created_at,
        updated_at
    )
    SELECT
        id,
        title,
        description,
        p_s3_path,
        owner_user_id,
        document_type_id,
        bundle_id,
        created_at,
        updated_at
    FROM
        demos_app.document_pending_upload
    WHERE id = p_id;

    DELETE FROM
        demos_app.document_pending_upload
    WHERE
        id = p_id;

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to move document from processing to clean. Details: %', SQLERRM;
END;
$$;