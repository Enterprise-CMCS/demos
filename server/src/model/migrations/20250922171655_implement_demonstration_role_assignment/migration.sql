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
            status_id,
            state_id,
            current_phase_id,
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
            NEW.status_id,
            NEW.state_id,
            NEW.current_phase_id,
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
            status_id,
            state_id,
            current_phase_id,
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
            OLD.status_id,
            OLD.state_id,
            OLD.current_phase_id,
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
            status_id,
            current_phase_id,
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
            NEW.status_id,
            NEW.current_phase_id,
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
            status_id,
            current_phase_id,
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
            OLD.status_id,
            OLD.current_phase_id,
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

CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id,
            state_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.demonstration_id,
            NEW.role_id,
            NEW.state_id,
            NEW.person_type_id,
            NEW.grant_level_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id,
            state_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.demonstration_id,
            OLD.role_id,
            OLD.state_id,
            OLD.person_type_id,
            OLD.grant_level_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_demonstration_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.demonstration_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_demonstration_role_assignment();

CREATE OR REPLACE FUNCTION demos_app.log_changes_person_state()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.person_state_history (
            revision_type,
            person_id,
            state_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.state_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.person_state_history (
            revision_type,
            person_id,
            state_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.state_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_person_state_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.person_state
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_person_state();

CREATE OR REPLACE FUNCTION demos_app.log_changes_primary_demonstration_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.primary_demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.demonstration_id,
            NEW.role_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.primary_demonstration_role_assignment_history (
            revision_type,
            person_id,
            demonstration_id,
            role_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.demonstration_id,
            OLD.role_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_primary_demonstration_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.primary_demonstration_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_primary_demonstration_role_assignment();

-- constraint trigger function to check for primary project officer
CREATE OR REPLACE FUNCTION demos_app.check_demonstration_primary_project_officer()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's a primary project officer for this demonstration
    IF NOT EXISTS (
        SELECT 1 
        FROM demos_app.primary_demonstration_role_assignment pdra
        WHERE pdra.demonstration_id = NEW.id 
        AND pdra.role_id = 'Project Officer'
    ) THEN
        RAISE EXCEPTION 'Demonstration % must have a primary project officer assigned', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- apply trigger to table with deferred evaluation
CREATE CONSTRAINT TRIGGER check_demonstration_primary_project_officer_trigger
    AFTER INSERT OR UPDATE ON demos_app.demonstration
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW 
    EXECUTE FUNCTION demos_app.check_demonstration_primary_project_officer();

-- trigger on primary_demonstration_role_assignment to check when assignments are changed
CREATE OR REPLACE FUNCTION demos_app.check_demonstration_retains_primary_project_officer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on DELETE or UPDATE that changes the role away from Project Officer
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role_id != NEW.role_id) THEN
        -- First check if the demonstration still exists (skip constraint if demonstration is being deleted)
        IF NOT EXISTS (
            SELECT 1 
            FROM demos_app.demonstration 
            WHERE id = OLD.demonstration_id
        ) THEN
            -- Demonstration is being deleted, so we don't need to enforce the constraint
            RETURN COALESCE(NEW, OLD);
        END IF;

        -- Check if this was the last primary project officer for the demonstration
        IF NOT EXISTS (
            SELECT 1 
            FROM demos_app.primary_demonstration_role_assignment pdra
            WHERE pdra.demonstration_id = OLD.demonstration_id
            AND pdra.role_id = 'Project Officer'
            AND (TG_OP = 'DELETE' OR pdra.role_id != OLD.role_id)
        ) THEN
            RAISE EXCEPTION 'Cannot remove the last primary project officer from demonstration %', 
                OLD.demonstration_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- apply trigger to table with deferred evaluation
CREATE CONSTRAINT TRIGGER check_demonstration_retains_primary_project_officer_trigger
    AFTER DELETE OR UPDATE ON demos_app.primary_demonstration_role_assignment
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW 
    EXECUTE FUNCTION demos_app.check_demonstration_retains_primary_project_officer();

INSERT INTO
    "demonstration_grant_level_limit"
VALUES
    ('Demonstration');
