/*
  Warnings:

  - A unique constraint covering the columns `[id,bundle_type_id]` on the table `demonstration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bundle_type_id` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bundle_type_id` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demonstration" ADD COLUMN     "bundle_type_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demonstration_history" ADD COLUMN     "bundle_type_id" TEXT NOT NULL;

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
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_type_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_type_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "demonstration_bundle_type" (
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_bundle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demonstration_bundle_type_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,

    CONSTRAINT "demonstration_bundle_type_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_id_bundle_type_id_key" ON "bundle"("id", "bundle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "demonstration_id_bundle_type_id_key" ON "demonstration"("id", "bundle_type_id");

-- AddForeignKey
ALTER TABLE "bundle" ADD CONSTRAINT "bundle_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_id_bundle_type_id_fkey" FOREIGN KEY ("id", "bundle_type_id") REFERENCES "bundle"("id", "bundle_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_bundle_type_id_fkey" FOREIGN KEY ("bundle_type_id") REFERENCES "demonstration_bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demonstration_bundle_type" ADD CONSTRAINT "demonstration_bundle_type_id_fkey" FOREIGN KEY ("id") REFERENCES "bundle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle_type()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_type_history (
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
        INSERT INTO demos_app.bundle_type_history (
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

CREATE OR REPLACE TRIGGER log_changes_bundle_type_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle_type
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle_type();

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
            evaluation_period_start_date,
            evaluation_period_end_date,
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
            NEW.evaluation_period_start_date,
            NEW.evaluation_period_end_date,
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
            evaluation_period_start_date,
            evaluation_period_end_date,
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
            OLD.evaluation_period_start_date,
            OLD.evaluation_period_end_date,
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

CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration_bundle_type()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_bundle_type_history (
            revision_type,
            id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.demonstration_bundle_type_history (
            revision_type,
            id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_demonstration_bundle_type_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration_bundle_type
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration_bundle_type();

