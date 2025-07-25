/*
  Warnings:

  - Added the required column `name` to the `modification_status` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `modification_status_history` table without a default value. This is not possible if the table is not empty.

*/

-- Emptying modification table to allow changes
-- Then from modification status
-- Can't use truncate here because it doesn't sequence properly
-- Added WHERE 1 = 1 because otherwise SonarQube fails
DELETE FROM "modification" WHERE 1 = 1;
DELETE FROM "modification_status" WHERE 1 = 1;

-- AlterTable
ALTER TABLE "modification_status" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "modification_status_history" ADD COLUMN     "name" TEXT NOT NULL;

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
