-- Drop existing history logging functions and triggers
DO $$
DECLARE
    function_trigger_record RECORD;
BEGIN
    FOR function_trigger_record IN
        SELECT
            c.relname AS table_name,
            t.tgname AS trigger_name,
            p.proname AS function_name
        FROM
            pg_trigger AS t
        INNER JOIN
            pg_proc AS p ON
                t.tgfoid = p.oid
        INNER JOIN
            pg_class AS c ON
                t.tgrelid = c.oid
        INNER JOIN
            pg_namespace AS n ON
                c.relnamespace = n.oid
                AND p.pronamespace = n.oid
        WHERE
            p.proname LIKE 'log_changes_%'
            AND n.nspname = 'demos_app'
    LOOP
        EXECUTE format(
            'DROP TRIGGER %I ON demos_app.%I;',
            function_trigger_record.trigger_name,
            function_trigger_record.table_name
        );
        RAISE NOTICE
            'Dropped trigger % on demos_app.%',
            function_trigger_record.trigger_name,
            function_trigger_record.table_name;

        EXECUTE format(
            'DROP FUNCTION demos_app.%I();',
            function_trigger_record.function_name
        );
        RAISE NOTICE
            'Dropped function demos_app.%()',
            function_trigger_record.function_name;
    END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION demos_app.log_changes_amendment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.amendment_history (
            revision_type,
            id,
            application_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            status_id,
            current_phase_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.application_type_id,
            NEW.demonstration_id,
            NEW.name,
            NEW.description,
            NEW.effective_date,
            NEW.expiration_date,
            NEW.status_id,
            NEW.current_phase_id,
            NEW.clearance_level_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.amendment_history (
            revision_type,
            id,
            application_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            status_id,
            current_phase_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.application_type_id,
            OLD.demonstration_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.status_id,
            OLD.current_phase_id,
            OLD.clearance_level_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_amendment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.amendment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_amendment();

CREATE OR REPLACE FUNCTION demos_app.log_changes_application()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.application_history (
            revision_type,
            id,
            application_type_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.application_type_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.application_history (
            revision_type,
            id,
            application_type_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.application_type_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_application_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.application
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_application();

CREATE OR REPLACE FUNCTION demos_app.log_changes_application_date()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.application_date_history (
            revision_type,
            application_id,
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
            NEW.application_id,
            NEW.date_type_id,
            NEW.date_value,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.application_date_history (
            revision_type,
            application_id,
            date_type_id,
            date_value,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.application_id,
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

CREATE OR REPLACE TRIGGER log_changes_application_date_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.application_date
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_application_date();

CREATE OR REPLACE FUNCTION demos_app.log_changes_application_note()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.application_note_history (
            revision_type,
            application_id,
            note_type_id,
            content,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.application_id,
            NEW.note_type_id,
            NEW.content,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.application_note_history (
            revision_type,
            application_id,
            note_type_id,
            content,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.application_id,
            OLD.note_type_id,
            OLD.content,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_application_note_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.application_note
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_application_note();

CREATE OR REPLACE FUNCTION demos_app.log_changes_application_phase()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.application_phase_history (
            revision_type,
            application_id,
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
            NEW.application_id,
            NEW.phase_id,
            NEW.phase_status_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.application_phase_history (
            revision_type,
            application_id,
            phase_id,
            phase_status_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.application_id,
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

CREATE OR REPLACE TRIGGER log_changes_application_phase_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.application_phase
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_application_phase();

CREATE OR REPLACE FUNCTION demos_app.log_changes_demonstration()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.demonstration_history (
            revision_type,
            id,
            application_type_id,
            name,
            description,
            effective_date,
            expiration_date,
            sdg_division_id,
            signature_level_id,
            status_id,
            current_phase_id,
            state_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.application_type_id,
            NEW.name,
            NEW.description,
            NEW.effective_date,
            NEW.expiration_date,
            NEW.sdg_division_id,
            NEW.signature_level_id,
            NEW.status_id,
            NEW.current_phase_id,
            NEW.state_id,
            NEW.clearance_level_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.demonstration_history (
            revision_type,
            id,
            application_type_id,
            name,
            description,
            effective_date,
            expiration_date,
            sdg_division_id,
            signature_level_id,
            status_id,
            current_phase_id,
            state_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.application_type_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.sdg_division_id,
            OLD.signature_level_id,
            OLD.status_id,
            OLD.current_phase_id,
            OLD.state_id,
            OLD.clearance_level_id,
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

CREATE OR REPLACE FUNCTION demos_app.log_changes_document()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.s3_path,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.application_id,
            NEW.phase_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.s3_path,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.application_id,
            OLD.phase_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document();

CREATE OR REPLACE FUNCTION demos_app.log_changes_document_pending_upload()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            name,
            description,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.application_id,
            NEW.phase_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_pending_upload_history (
            revision_type,
            id,
            name,
            description,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.application_id,
            OLD.phase_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_pending_upload_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document_pending_upload
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document_pending_upload();

CREATE OR REPLACE FUNCTION demos_app.log_changes_document_infected()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.document_infected_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            infection_status,
            infection_threats,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.s3_path,
            NEW.owner_user_id,
            NEW.document_type_id,
            NEW.application_id,
            NEW.phase_id,
            NEW.infection_status,
            NEW.infection_threats,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.document_infected_history (
            revision_type,
            id,
            name,
            description,
            s3_path,
            owner_user_id,
            document_type_id,
            application_id,
            phase_id,
            infection_status,
            infection_threats,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.s3_path,
            OLD.owner_user_id,
            OLD.document_type_id,
            OLD.application_id,
            OLD.phase_id,
            OLD.infection_status,
            OLD.infection_threats,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_document_infected_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.document_infected
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_document_infected();

CREATE OR REPLACE FUNCTION demos_app.log_changes_extension()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.extension_history (
            revision_type,
            id,
            application_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            status_id,
            current_phase_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.id,
            NEW.application_type_id,
            NEW.demonstration_id,
            NEW.name,
            NEW.description,
            NEW.effective_date,
            NEW.expiration_date,
            NEW.status_id,
            NEW.current_phase_id,
            NEW.clearance_level_id,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.extension_history (
            revision_type,
            id,
            application_type_id,
            demonstration_id,
            name,
            description,
            effective_date,
            expiration_date,
            status_id,
            current_phase_id,
            clearance_level_id,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.application_type_id,
            OLD.demonstration_id,
            OLD.name,
            OLD.description,
            OLD.effective_date,
            OLD.expiration_date,
            OLD.status_id,
            OLD.current_phase_id,
            OLD.clearance_level_id,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_extension_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.extension
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_extension();

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

CREATE OR REPLACE TRIGGER log_changes_person_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.person
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_person();

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

CREATE OR REPLACE FUNCTION demos_app.log_changes_role_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            grant_level_id,
            permission_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.role_id,
            NEW.grant_level_id,
            NEW.permission_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.role_permission_history (
            revision_type,
            role_id,
            grant_level_id,
            permission_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.role_id,
            OLD.grant_level_id,
            OLD.permission_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_role_permission_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.role_permission
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_role_permission();

CREATE OR REPLACE FUNCTION demos_app.log_changes_system_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.system_role_assignment_history (
            revision_type,
            person_id,
            role_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::demos_app.revision_type_enum
                WHEN 'UPDATE' THEN 'U'::demos_app.revision_type_enum
            END,
            NEW.person_id,
            NEW.role_id,
            NEW.person_type_id,
            NEW.grant_level_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.system_role_assignment_history (
            revision_type,
            person_id,
            role_id,
            person_type_id,
            grant_level_id
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.person_id,
            OLD.role_id,
            OLD.person_type_id,
            OLD.grant_level_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_system_role_assignment_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.system_role_assignment
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_system_role_assignment();

CREATE OR REPLACE FUNCTION demos_app.log_changes_users()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            person_type_id,
            cognito_subject,
            username,
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
            NEW.cognito_subject,
            NEW.username,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demos_app.users_history (
            revision_type,
            id,
            person_type_id,
            cognito_subject,
            username,
            created_at,
            updated_at
        )
        VALUES (
            'D'::demos_app.revision_type_enum,
            OLD.id,
            OLD.person_type_id,
            OLD.cognito_subject,
            OLD.username,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_changes_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON demos_app.users
FOR EACH ROW EXECUTE FUNCTION demos_app.log_changes_users();
