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

-- Need to fix the steps taken when a new application is created
-- Have to do them in a proper sequence
-- First, clean up old items
DROP TRIGGER IF EXISTS create_phases_for_new_application_trigger ON demos_app.bundle;
DROP FUNCTION IF EXISTS demos_app.create_phases_for_new_application();

-- Now, unified function
CREATE OR REPLACE FUNCTION demos_app.create_phases_and_dates_for_new_application()
RETURNS TRIGGER AS $$
DECLARE
    v_phase_id TEXT;
    v_first_phase_id TEXT;
    v_phase_status_id TEXT;
BEGIN
    -- Identify the first phase
    SELECT id INTO v_first_phase_id FROM demos_app.phase WHERE phase_number = 1;

    -- Populate all phases for the new application
    FOR v_phase_id IN
        SELECT id FROM demos_app.phase WHERE id != 'None'
    LOOP
        -- The first phase should be set to started
        IF v_phase_id = v_first_phase_id THEN
            v_phase_status_id := 'Started';
        ELSE
            v_phase_status_id := 'Not Started';
        END IF;
        INSERT INTO demos_app.bundle_phase (
            bundle_id,
            phase_id,
            phase_status_id,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            v_phase_id,
            v_phase_status_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END LOOP;

    INSERT INTO
        demos_app.bundle_phase_date (
            bundle_id,
            phase_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
    VALUES (
        NEW.id,
        v_first_phase_id,
        'Start Date',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_phases_and_dates_for_new_application_trigger
AFTER INSERT ON demos_app.bundle
FOR EACH ROW EXECUTE FUNCTION demos_app.create_phases_and_dates_for_new_application();

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
