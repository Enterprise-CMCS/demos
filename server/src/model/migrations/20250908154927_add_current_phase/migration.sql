/*
  Warnings:

  - Added the required column `current_phase_id` to the `demonstration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_phase_id` to the `demonstration_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_phase_id` to the `modification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_phase_id` to the `modification_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demonstration" ADD COLUMN     "current_phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "demonstration_history" ADD COLUMN     "current_phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "modification" ADD COLUMN     "current_phase_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "modification_history" ADD COLUMN     "current_phase_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "demonstration" ADD CONSTRAINT "demonstration_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modification" ADD CONSTRAINT "modification_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
            current_phase_id,
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
            NEW.current_phase_id,
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
            current_phase_id,
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
            OLD.current_phase_id,
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
            current_phase_id,
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
            NEW.current_phase_id,
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
            current_phase_id,
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
            OLD.current_phase_id,
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
