-- AlterTable
ALTER TABLE "demonstration" ADD COLUMN     "cmcs_division" TEXT,
ADD COLUMN     "signature_level" TEXT;

-- AlterTable
ALTER TABLE "demonstration_history" ADD COLUMN     "cmcs_division" TEXT,
ADD COLUMN     "signature_level" TEXT;

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
            cmcs_division,
            signature_level,
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
            NEW.effective_date,
            NEW.expiration_date,
            NEW.cmcs_division,
            NEW.signature_level,
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
            effective_date,
            expiration_date,
            cmcs_division,
            signature_level,
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
            OLD.effective_date,
            OLD.expiration_date,
            OLD.cmcs_division,
            OLD.signature_level,
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
