/*
  Warnings:

  - Added the required column `first_name` to the `person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `person` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demos_app"."person"
  ADD COLUMN "first_name" TEXT NOT NULL,
  ADD COLUMN "last_name" TEXT NOT NULL,
  DROP COLUMN "display_name",
  DROP COLUMN "full_name";

ALTER TABLE "demos_app"."person_history"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  DROP COLUMN "display_name",
  DROP COLUMN "full_name";

CREATE OR REPLACE FUNCTION demos_app.log_changes_person()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.person_history (
            revision_type,
            id,
            person_type_id,
            email,
            first_name,
            last_name,
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
            NEW.first_name,
            NEW.last_name,
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
            first_name,
            last_name,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.person_type_id,
            OLD.email,
            OLD.first_name,
            OLD.last_name,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

/*
-- reverse
ALTER TABLE "demos_app"."person"
  ADD COLUMN "display_name" TEXT NOT NULL,
  ADD COLUMN "full_name" TEXT NOT NULL,
  DROP COLUMN "first_name",
  DROP COLUMN "last_name";
*/
