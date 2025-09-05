-- CreateTable
CREATE TABLE "bundle_phase_status" (
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_status_pkey" PRIMARY KEY ("bundle_id","phase_id")
);

-- CreateTable
CREATE TABLE "bundle_phase_status_history" (
    "revision_id" SERIAL NOT NULL,
    "revision_type" "revision_type_enum" NOT NULL,
    "modified_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundle_id" UUID NOT NULL,
    "phase_id" TEXT NOT NULL,
    "phase_status_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bundle_phase_status_history_pkey" PRIMARY KEY ("revision_id")
);

-- CreateTable
CREATE TABLE "phase" (
    "id" TEXT NOT NULL,
    "phase_number" INTEGER NOT NULL,

    CONSTRAINT "phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phase_status" (
    "id" TEXT NOT NULL,

    CONSTRAINT "phase_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phase_phase_number_key" ON "phase"("phase_number");

-- AddForeignKey
ALTER TABLE "bundle_phase_status" ADD CONSTRAINT "bundle_phase_status_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_phase_status" ADD CONSTRAINT "bundle_phase_status_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_phase_status" ADD CONSTRAINT "bundle_phase_status_phase_status_id_fkey" FOREIGN KEY ("phase_status_id") REFERENCES "phase_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- History Trigger
CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle_phase_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_phase_status_history (
            revision_type,
            bundle_id,
            phase_id,
            phase_status_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.bundle_id,
            NEW.phase_id,
            NEW.phase_status_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.bundle_phase_status_history (
            revision_type,
            bundle_id,
            phase_id,
            phase_status_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.bundle_id,
            OLD.phase_id,
            OLD.phase_status_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_bundle_phase_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle_phase_status
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle_phase_status();

-- Adding Phases Trigger
CREATE OR REPLACE FUNCTION demos_app.create_phases_for_new_application()
RETURNS TRIGGER AS $$
DECLARE
    phase_id_value TEXT;
BEGIN
    FOR phase_id_value IN
        SELECT
            id
        FROM
            demos_app.phase
        WHERE
            id != 'None'
    LOOP
        INSERT INTO demos_app.bundle_phase_status (
            bundle_id,
            phase_id,
            phase_status_id,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            phase_id_value,
            'Not Started',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_phases_for_new_application_trigger
AFTER INSERT ON demos_app.bundle
FOR EACH ROW EXECUTE FUNCTION demos_app.create_phases_for_new_application();

-- Standard values
INSERT INTO
    "phase"
VALUES
    ('None', 0), -- Used when documents are directly attached to a demonstration
    ('Concept', 1),
    ('State Application', 2),
    ('Completeness', 3);

INSERT INTO
    "phase_status"
VALUES
    ('Not Started'),
    ('Started'),
    ('Completed'),
    ('Skipped');
