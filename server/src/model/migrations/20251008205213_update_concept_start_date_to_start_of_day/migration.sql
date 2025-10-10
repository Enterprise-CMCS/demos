-- Constraining the demonstration title to be non-empty
ALTER TABLE "demos_app"."demonstration" ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');

-- Fixing trigger that creates records when an application is made
-- This makes it so that the new start dates are at the start of day
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
        timezone('America/New_York', date_trunc('day', timezone('America/New_York', CURRENT_TIMESTAMP))),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER create_phases_and_dates_for_new_application_trigger
AFTER INSERT ON demos_app.bundle
FOR EACH ROW EXECUTE FUNCTION demos_app.create_phases_and_dates_for_new_application();

-- Accidentally made two versions of completeness review due date due to a typo on the page
UPDATE
    "demos_app"."phase_date_type"
SET
    "date_type_id" = 'Completeness Review Due Date'
WHERE
    "date_type_id" = 'Completeness Due Date';

DELETE FROM
    "demos_app"."date_type"
WHERE
    "id" = 'Completeness Due Date';
