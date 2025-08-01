-- CreateTable
CREATE TABLE "extension" (
  "id" UUID NOT NULL,
  "bundle_type_id" TEXT NOT NULL,
  "demonstration_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "effective_date" DATE NOT NULL,
  "expiration_date" DATE NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "extension_status_id" TEXT NOT NULL,
  "project_officer_user_id" UUID NOT NULL,
  CONSTRAINT "extension_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "extension_history" (
  "revision_id" SERIAL NOT NULL,
  "revision_type" "revision_type_enum" NOT NULL,
  "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "id" UUID NOT NULL,
  "bundle_type_id" TEXT NOT NULL,
  "demonstration_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "effective_date" DATE NOT NULL,
  "expiration_date" DATE NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "extension_status_id" TEXT NOT NULL,
  "project_officer_user_id" UUID NOT NULL,
  CONSTRAINT "extension_history_pkey" PRIMARY KEY ("revision_id")
);
-- CreateTable
CREATE TABLE "extension_bundle_type" (
  "id" TEXT NOT NULL,
  CONSTRAINT "extension_bundle_type_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "extension_status" (
  "id" TEXT NOT NULL,
  "bundle_type_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "extension_status_pkey" PRIMARY KEY ("id", "bundle_type_id")
);
-- CreateTable
CREATE TABLE "extension_status_history" (
  "revision_id" SERIAL NOT NULL,
  "revision_type" "revision_type_enum" NOT NULL,
  "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "id" TEXT NOT NULL,
  "bundle_type_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "extension_status_history_pkey" PRIMARY KEY ("revision_id")
);
ALTER TABLE demos_app.bundle_type
ADD COLUMN created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
-- AddForeignKey
ALTER TABLE "extension"
ADD CONSTRAINT "extension_id_bundle_type_id_fkey" FOREIGN KEY ("id", "bundle_type_id") REFERENCES "bundle"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension"
ADD CONSTRAINT "extension_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "extension_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension"
ADD CONSTRAINT "extension_demonstration_id_fkey" FOREIGN KEY ("demonstration_id") REFERENCES "demonstration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension"
ADD CONSTRAINT "extension_extension_status_id_bundle_type_id_fkey" FOREIGN KEY ("extension_status_id", "bundle_type_id") REFERENCES "extension_status"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension"
ADD CONSTRAINT "extension_project_officer_user_id_fkey" FOREIGN KEY ("project_officer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension_bundle_type"
ADD CONSTRAINT "extension_bundle_type_id_fkey" FOREIGN KEY ("id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "extension_status"
ADD CONSTRAINT "extension_status_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "extension_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Logging triggers
CREATE OR REPLACE FUNCTION demos_app.log_changes_extension() RETURNS TRIGGER AS $$ BEGIN IF TG_OP IN ('INSERT', 'UPDATE') THEN
INSERT INTO demos_app.extension_history (
    revision_type,
    id,
    bundle_type_id,
    demonstration_id,
    name,
    description,
    effective_date,
    expiration_date,
    created_at,
    updated_at,
    extension_status_id,
    project_officer_user_id
  )
VALUES (
    CASE
      TG_OP
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
    NEW.created_at,
    NEW.updated_at,
    NEW.extension_status_id,
    NEW.project_officer_user_id
  );
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
INSERT INTO demos_app.extension_history (
    revision_type,
    id,
    bundle_type_id,
    demonstration_id,
    name,
    description,
    effective_date,
    expiration_date,
    created_at,
    updated_at,
    extension_status_id,
    project_officer_user_id
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
    OLD.created_at,
    OLD.updated_at,
    OLD.extension_status_id,
    OLD.project_officer_user_id
  );
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER log_changes_extension_trigger
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON demos_app.extension FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_extension();
CREATE OR REPLACE FUNCTION demos_app.log_changes_extension_status() RETURNS TRIGGER AS $$ BEGIN IF TG_OP IN ('INSERT', 'UPDATE') THEN
INSERT INTO demos_app.extension_status_history (
    revision_type,
    id,
    bundle_type_id,
    description,
    created_at,
    updated_at
  )
VALUES (
    CASE
      TG_OP
      WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
      WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
    END,
    NEW.id,
    NEW.bundle_type_id,
    NEW.description,
    NEW.created_at,
    NEW.updated_at
  );
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
INSERT INTO demos_app.extension_status_history (
    revision_type,
    id,
    bundle_type_id,
    description,
    created_at,
    updated_at
  )
VALUES (
    'D'::demos_app.revision_type_enum,
    OLD.id,
    OLD.bundle_type_id,
    OLD.description,
    OLD.created_at,
    OLD.updated_at
  );
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER log_changes_extension_status_trigger
AFTER
INSERT
  OR
UPDATE
  OR DELETE ON demos_app.extension_status FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_extension_status();
-- Insert standard values
INSERT INTO bundle_type (id, name, description, created_at, updated_at)
VALUES (
    'EXTENSION',
    'Extension',
    'Extension bundle type.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
INSERT INTO extension_bundle_type (id)
VALUES ('EXTENSION');
