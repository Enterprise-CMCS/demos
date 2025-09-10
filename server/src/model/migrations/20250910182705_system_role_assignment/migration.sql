-- CreateTable
CREATE TABLE "demos_app"."role_person_type" (
    "role_id" TEXT NOT NULL,
    "person_type_id" TEXT NOT NULL,

    CONSTRAINT "role_person_type_pkey" PRIMARY KEY ("role_id","person_type_id")
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
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_role_id_grant_level_id_fkey" FOREIGN KEY ("role_id", "grant_level_id") REFERENCES "demos_app"."role"("id", "grantLevelId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos_app"."system_role_assignment" ADD CONSTRAINT "system_role_assignment_grant_level_id_fkey" FOREIGN KEY ("grant_level_id") REFERENCES "demos_app"."system_grant_level_limit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE OR REPLACE FUNCTION demos_app.log_changes_system_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.system_role_assignment_history (
            revision_type,
            person_id,
            role_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.role_id,
            NEW.person_type_id,
            NEW.grant_level_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.system_role_assignment_history (
            revision_type,
            person_id,
            role_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.role_id,
            OLD.person_type_id,
            OLD.grant_level_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_system_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.system_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_system_role_assignment();

INSERT INTO
    "system_grant_level_limit"
VALUES
    ('System'),

INSERT INTO
    "role_person_type"
VALUES
    ('Project Officer', 'demos-admin'),
    ('Project Officer', 'demos-cms-user'),
    ('State Point of Contact', 'demos-admin'),
    ('State Point of Contact', 'demos-cms-user'),
    ('State Point of Contact', 'demos-state-user'),
    ('DDME Analyst', 'demos-admin'),
    ('DDME Analyst', 'demos-cms-user'),
    ('Policy Technical Director', 'demos-admin'),
    ('Policy Technical Director', 'demos-cms-user'),
    ('Monitoring & Evaluation Technical Director', 'demos-admin'),
    ('Monitoring & Evaluation Technical Director', 'demos-cms-user'),
    ('All Users', 'demos-admin'),  
    ('All Users', 'demos-cms-user'),
    ('All Users', 'demos-state-user');
