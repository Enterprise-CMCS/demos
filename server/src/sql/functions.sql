DO $$
DECLARE
    trigger_record RECORD;
    proc_record RECORD;
BEGIN
    -- Delete all the triggers relating to functions and procedures first
    FOR trigger_record IN
        SELECT
            c.relname AS table_name,
            t.tgname AS trigger_name
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
            n.nspname = 'demos_app'
            AND p.proname NOT LIKE 'log_changes_%'
    LOOP
        EXECUTE format(
            'DROP TRIGGER %I ON demos_app.%I;',
            trigger_record.trigger_name,
            trigger_record.table_name
        );
        RAISE NOTICE
            'Dropped trigger % on demos_app.%',
            trigger_record.trigger_name,
            trigger_record.table_name;
    END LOOP;

    -- Then, delete all the functions and procedures themselves
    FOR proc_record IN
        SELECT
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS function_args,
            p.prokind
        FROM
            pg_proc AS p
        INNER JOIN
            pg_namespace AS n ON
                p.pronamespace = n.oid
        WHERE
            n.nspname = 'demos_app'
            AND p.proname NOT LIKE 'log_changes_%'
    LOOP
        IF proc_record.prokind = 'p' THEN
            EXECUTE format(
                'DROP PROCEDURE demos_app.%I(%s);',
                proc_record.function_name,
                proc_record.function_args
            );
            RAISE NOTICE
                'Dropped procedure demos_app.%(%)',
                proc_record.function_name,
                proc_record.function_args;
        ELSE
            EXECUTE format(
                'DROP FUNCTION demos_app.%I(%s);',
                proc_record.function_name,
                proc_record.function_args
            );
            RAISE NOTICE
                'Dropped function demos_app.%(%)',
                proc_record.function_name,
                proc_record.function_args;
        END IF;
    END LOOP;
END
$$;

-- assign_cms_user_to_all_states
CREATE FUNCTION demos_app.assign_cms_user_to_all_states()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the inserted person is a demos-cms-user or a demos-admin
    IF NEW.person_type_id IN ('demos-admin', 'demos-cms-user') THEN
        -- Insert a record into person_state for each state
        INSERT INTO demos_app.person_state (person_id, state_id)
        SELECT
            NEW.id,
            s.id
        FROM demos_app.state AS s;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_assign_cms_user_to_states
AFTER INSERT ON demos_app.person
FOR EACH ROW
EXECUTE FUNCTION demos_app.assign_cms_user_to_all_states();

-- check_demonstration_primary_project_officer
CREATE FUNCTION demos_app.check_demonstration_primary_project_officer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if there's a primary project officer for this demonstration
    IF NOT EXISTS (
        SELECT 1
        FROM demos_app.primary_demonstration_role_assignment AS pdra
        WHERE pdra.demonstration_id = NEW.id
        AND pdra.role_id = 'Project Officer'
    ) THEN
        RAISE EXCEPTION 'Demonstration % must have a primary project officer assigned', NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER check_demonstration_primary_project_officer_trigger
AFTER INSERT OR UPDATE ON demos_app.demonstration
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_demonstration_primary_project_officer();

-- check_demonstration_retains_primary_project_officer
CREATE FUNCTION demos_app.check_demonstration_retains_primary_project_officer()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'DELETE' AND OLD.role_id = 'Project Officer') THEN
        IF EXISTS (
            SELECT 1
            FROM
                demos_app.demonstration
            WHERE
                id = OLD.demonstration_id
        ) THEN
            RAISE EXCEPTION 'Cannot remove the primary project officer from demonstration %', OLD.demonstration_id;
        END IF;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.role_id = 'Project Officer' AND NEW.role_id != 'Project Officer') THEN
        IF NOT EXISTS (
            SELECT 1
            FROM
                demos_app.primary_demonstration_role_assignment AS prda
            WHERE
                demonstration_id = OLD.demonstration_id
                AND role_id = 'Project Officer'
        ) THEN
            RAISE EXCEPTION 'Cannot remove the primary project officer from demonstration %', OLD.demonstration_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER check_demonstration_retains_primary_project_officer_trigger
AFTER DELETE OR UPDATE ON demos_app.primary_demonstration_role_assignment
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_demonstration_retains_primary_project_officer();

-- create_phases_and_dates_for_new_application
CREATE FUNCTION demos_app.create_phases_and_dates_for_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
        INSERT INTO demos_app.application_phase (
            application_id,
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
        demos_app.application_date (
            application_id,
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
$$;

CREATE TRIGGER create_phases_and_dates_for_new_application_trigger
AFTER INSERT ON demos_app.application
FOR EACH ROW
EXECUTE FUNCTION demos_app.create_phases_and_dates_for_new_application();

-- move_document_from_processing_to_clean
CREATE PROCEDURE demos_app.move_document_from_processing_to_clean(
    p_id UUID,
    p_s3_path TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (SELECT id FROM demos_app.document_pending_upload WHERE id = p_id) THEN
        RAISE EXCEPTION 'No document_pending_upload found for id: %', p_id;
    END IF;

    INSERT INTO demos_app.document (
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
    SELECT
        id,
        name,
        description,
        p_s3_path,
        owner_user_id,
        document_type_id,
        application_id,
        phase_id,
        created_at,
        updated_at
    FROM
        demos_app.document_pending_upload
    WHERE id = p_id;

    DELETE FROM
        demos_app.document_pending_upload
    WHERE
        id = p_id;

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to move document from processing to clean. Details: %', SQLERRM;
END;
$$;

-- check_that_main_record_deleted_from_application
CREATE FUNCTION demos_app.check_that_main_record_deleted_from_application()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM demos_app.application WHERE id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete from demos_app.% table while the corresponding record is in demos_app.application', TG_TABLE_NAME;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER check_that_main_record_deleted_from_application_trigger
BEFORE DELETE ON demos_app.amendment
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_that_main_record_deleted_from_application();

CREATE TRIGGER check_that_main_record_deleted_from_application_trigger
BEFORE DELETE ON demos_app.demonstration
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_that_main_record_deleted_from_application();

CREATE TRIGGER check_that_main_record_deleted_from_application_trigger
BEFORE DELETE ON demos_app.extension
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_that_main_record_deleted_from_application();

-- check_application_type_record_exists
CREATE FUNCTION demos_app.check_application_type_record_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.application_type_id = 'Amendment' THEN
        IF NOT EXISTS (SELECT 1 FROM demos_app.amendment WHERE amendment.id = NEW.id) THEN
            RAISE EXCEPTION 'No matching record in demos_app.amendment for application %', NEW.id;
        END IF;
    ELSIF NEW.application_type_id = 'Demonstration' THEN
        IF NOT EXISTS (SELECT 1 FROM demos_app.demonstration WHERE demonstration.id = NEW.id) THEN
            RAISE EXCEPTION 'No matching record in demos_app.demonstration for application %', NEW.id;
        END IF;
    ELSIF NEW.application_type_id = 'Extension' THEN
        IF NOT EXISTS (SELECT 1 FROM demos_app.extension WHERE extension.id = NEW.id) THEN
            RAISE EXCEPTION 'No matching record in demos_app.extension for application %', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER check_application_type_record_exists_trigger
AFTER INSERT OR UPDATE ON demos_app.application
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.check_application_type_record_exists();
