-- Drop existing functions
DROP FUNCTION demos_app.log_changes_bundle_phase_status;

-- Add proper history trigger
CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle_phase()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_phase_history (
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
        INSERT INTO demos_app.bundle_phase_history (
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

CREATE OR REPLACE TRIGGER log_changes_bundle_phase_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle_phase
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle_phase();

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
        INSERT INTO demos_app.bundle_phase (
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
