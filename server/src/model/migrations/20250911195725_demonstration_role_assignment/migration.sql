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

-- CreateIndex
CREATE UNIQUE INDEX "primary_demonstration_role_assignment_person_id_demonstrati_key" ON "demos_app"."primary_demonstration_role_assignment"("person_id", "demonstration_id", "role_id");

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
ALTER TABLE "demos_app"."person_state" ADD CONSTRAINT "person_state_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "demos_app"."person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."person_state" ADD CONSTRAINT "person_state_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "demos_app"."state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."primary_demonstration_role_assignment" ADD CONSTRAINT "primary_demonstration_role_assignment_person_id_demonstrat_fkey" FOREIGN KEY ("person_id", "demonstration_id", "role_id") REFERENCES "demos_app"."demonstration_role_assignment"("person_id", "demonstration_id", "role_id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id,
            state_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.demonstration_id,
            NEW.role_id,
            NEW.state_id,
            NEW.person_type_id,
            NEW.grant_level_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id,
            state_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.demonstration_id,
            OLD.role_id,
            OLD.state_id,
            OLD.person_type_id,
            OLD.grant_level_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_demonstration_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration_role_assignment();

CREATE OR REPLACE FUNCTION demos_app.log_changes_person_state()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.person_state_history (
            revision_type,
            person_id,
            state_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.state_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.person_state_history (
            revision_type,
            person_id,
            state_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.state_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_person_state_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.person_state
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_person_state();

CREATE OR REPLACE FUNCTION demos_app.log_changes_primary_demonstration_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.primary_demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.demonstration_id,
            NEW.role_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.primary_demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.demonstration_id,
            OLD.role_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_primary_demonstration_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.primary_demonstration_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_primary_demonstration_role_assignment();

-- constraint trigger function to check for primary project officer
CREATE OR REPLACE FUNCTION demos_app.check_demonstration_primary_project_officer()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's a primary project officer for this demonstration
    IF NOT EXISTS (
        SELECT 1 
        FROM demos_app.primary_demonstration_role_assignment pdra
        WHERE pdra.demonstration_id = NEW.id 
        AND pdra.role_id = 'Project Officer'
    ) THEN
        RAISE EXCEPTION 'Demonstration % must have a primary project officer assigned', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- apply trigger to table with deferred evaluation
CREATE CONSTRAINT TRIGGER check_demonstration_primary_project_officer_trigger
    AFTER INSERT OR UPDATE ON demos_app.demonstration
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW 
    EXECUTE FUNCTION demos_app.check_demonstration_primary_project_officer();

-- trigger on primary_demonstration_role_assignment to check when assignments are changed
CREATE OR REPLACE FUNCTION demos_app.check_demonstration_retains_primary_project_officer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on DELETE or UPDATE that changes the role away from Project Officer
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role_id != NEW.role_id) THEN
        -- First check if the demonstration still exists (skip constraint if demonstration is being deleted)
        IF NOT EXISTS (
            SELECT 1 
            FROM demos_app.demonstration 
            WHERE id = OLD.demonstration_id
        ) THEN
            -- Demonstration is being deleted, so we don't need to enforce the constraint
            RETURN COALESCE(NEW, OLD);
        END IF;

        -- Check if this was the last primary project officer for the demonstration
        IF NOT EXISTS (
            SELECT 1 
            FROM demos_app.primary_demonstration_role_assignment pdra
            WHERE pdra.demonstration_id = OLD.demonstration_id
            AND pdra.role_id = 'Project Officer'
            AND (TG_OP = 'DELETE' OR pdra.role_id != OLD.role_id)
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last primary project officer from demonstration %', 
                OLD.demonstration_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- apply trigger to table with deferred evaluation
CREATE CONSTRAINT TRIGGER check_demonstration_retains_primary_project_officer_trigger
    AFTER DELETE OR UPDATE ON demos_app.primary_demonstration_role_assignment
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW 
    EXECUTE FUNCTION demos_app.check_demonstration_retains_primary_project_officer();

INSERT INTO
    "demonstration_grant_level_limit"
VALUES
    ('Demonstration');
