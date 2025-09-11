-- History trigger
CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle_phase_date()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_phase_date_history (
            revision_type,
            bundle_id,
            phase_id,
            date_type_id,
            date_value,
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
            NEW.date_type_id,
            NEW.date_value,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.bundle_phase_date_history (
            revision_type,
            bundle_id,
            phase_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.bundle_id,
            OLD.phase_id,
            OLD.date_type_id,
            OLD.date_value,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_bundle_phase_date_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle_phase_date
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle_phase_date();

-- Add first date on creation
CREATE OR REPLACE FUNCTION demos_app.create_initial_start_date_for_new_application()
RETURNS TRIGGER AS $$
DECLARE
    first_phase_id TEXT;
BEGIN
    SELECT
        id
    INTO
        first_phase_id
    FROM
        phase
    WHERE
        phase_number = 1;

    INSERT INTO
        bundle_phase_date (
            bundle_id,
            phase_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
    VALUES (
        NEW.id,
        first_phase_id,
        'Start Date',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_initial_start_date_for_new_application_trigger
AFTER INSERT ON demos_app.bundle
FOR EACH ROW EXECUTE FUNCTION demos_app.create_initial_start_date_for_new_application();

-- Inserting standard values
INSERT INTO
    date_type
VALUES
    ('Start Date'),
    ('Completion Date'),
    ('Pre-Submission Submitted Date'),
    ('State Application Submitted Date'),
    ('Completeness Review Due Date'),
    ('Completeness Due Date'),
    ('State Application Deemed Complete'),
    ('Federal Comment Period Start Date'),
    ('Federal Comment Period End Date');
