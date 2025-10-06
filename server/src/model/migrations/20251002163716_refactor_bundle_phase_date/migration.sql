DROP FUNCTION demos_app.log_changes_bundle_phase_date;

CREATE OR REPLACE FUNCTION demos_app.log_changes_bundle_date()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.bundle_date_history (
            revision_type,
            bundle_id,
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
            NEW.date_type_id,
            NEW.date_value,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.bundle_date_history (
            revision_type,
            bundle_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.bundle_id,
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

CREATE OR REPLACE TRIGGER log_changes_bundle_date_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.bundle_date
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_bundle_date();

-- This is an intentional full delete of these tables
TRUNCATE TABLE demos_app.date_type CASCADE;

UPDATE
    demos_app.phase
SET
    id = 'SDG Preparation'
WHERE
    id = 'SME/FRT';

UPDATE
    demos_app.phase
SET
    id = 'OGC & OMB Review'
WHERE
    id = 'OGC & OMB';

INSERT INTO
    demos_app.date_type
VALUES
    ('Concept Start Date'),
    ('Pre-Submission Submitted Date'),
    ('Concept Completion Date'),
    ('State Application Start Date'),
    ('State Application Submitted Date'),
    ('Completeness Review Due Date'),
    ('State Application Completion Date'),
    ('Completeness Start Date'),
    ('Completeness Due Date'),
    ('State Application Deemed Complete'),
    ('Federal Comment Period Start Date'),
    ('Federal Comment Period End Date'),
    ('Completeness Completion Date'),
    ('SDG Preparation Start Date'),
    ('Expected Approval Date'),
    ('SME Review Date'),
    ('FRT Initial Meeting Date'),
    ('BNPMT Initial Meeting Date'),
    ('SDG Preparation Completion Date'),
    ('OGC & OMB Review Start Date'),
    ('OGC Review Complete'),
    ('OMB Review Complete'),
    ('PO & OGD Sign-Off'),
    ('OGC & OMB Review Completion Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Concept', 'Concept Start Date'),
    ('Concept', 'Pre-Submission Submitted Date'),
    ('Concept', 'Concept Completion Date'),
    ('State Application', 'State Application Start Date'),
    ('State Application', 'State Application Submitted Date'),
    ('State Application', 'Completeness Review Due Date'),
    ('State Application', 'State Application Completion Date'),
    ('Completeness', 'Completeness Start Date'),
    ('Completeness', 'Completeness Due Date'),
    ('Completeness', 'State Application Deemed Complete'),
    ('Completeness', 'Federal Comment Period Start Date'),
    ('Completeness', 'Federal Comment Period End Date'),
    ('Completeness', 'Completeness Completion Date'),
    ('Federal Comment', 'Federal Comment Period Start Date'),
    ('Federal Comment', 'Federal Comment Period End Date'),
    ('SDG Preparation', 'SDG Preparation Start Date'),
    ('SDG Preparation', 'Expected Approval Date'),
    ('SDG Preparation', 'SME Review Date'),
    ('SDG Preparation', 'FRT Initial Meeting Date'),
    ('SDG Preparation', 'BNPMT Initial Meeting Date'),
    ('SDG Preparation', 'SDG Preparation Completion Date'),
    ('OGC & OMB Review', 'OGC & OMB Review Start Date'),
    ('OGC & OMB Review', 'OGC Review Complete'),
    ('OGC & OMB Review', 'OMB Review Complete'),
    ('OGC & OMB Review', 'PO & OGD Sign-Off'),
    ('OGC & OMB Review', 'OGC & OMB Review Completion Date');

-- Fixing trigger that creates records when an application is made
DROP TRIGGER IF EXISTS create_phases_for_new_application_trigger ON demos_app.bundle;
DROP FUNCTION IF EXISTS demos_app.create_phases_for_new_application();

CREATE OR REPLACE FUNCTION demos_app.create_phases_and_dates_for_new_application()
RETURNS TRIGGER AS $$
DECLARE
    v_phase_id TEXT;
    v_phase_num INT;
    v_phase_status_id TEXT;
BEGIN
    -- Populate all phases for the new application
    FOR v_phase_id, v_phase_num IN
        SELECT id, phase_number FROM demos_app.phase WHERE phase_number > 0
    LOOP
        -- The first phase should be set to started
        IF v_phase_num = 1 THEN
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
        demos_app.bundle_date (
            bundle_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
    VALUES (
        NEW.id,
        'Concept Start Date',
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
