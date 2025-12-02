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

-- move_document_from_pending_to_clean
CREATE PROCEDURE demos_app.move_document_from_pending_to_clean(
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
        RAISE EXCEPTION 'Failed to move document from pending to clean. Details: %', SQLERRM;
END;
$$;

-- move_document_from_pending_to_infected
CREATE PROCEDURE demos_app.move_document_from_pending_to_infected(
    p_id UUID,
    p_s3_path TEXT,
    p_infection_status TEXT,
    p_infection_threats TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (SELECT id FROM demos_app.document_pending_upload WHERE id = p_id) THEN
        RAISE EXCEPTION 'No document_pending_upload found for id: %', p_id;
    END IF;

    INSERT INTO demos_app.document_infected (
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
    SELECT
        id,
        name,
        description,
        p_s3_path,
        owner_user_id,
        document_type_id,
        application_id,
        phase_id,
        p_infection_status,
        p_infection_threats,
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
        RAISE EXCEPTION 'Failed to move document from pending to infected. Details: %', SQLERRM;
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

CREATE OR REPLACE FUNCTION demos_app.update_demonstration_current_phase_on_phase_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_max_phase_number INT;
    v_last_completed_phase_number INT;
    v_current_phase_id TEXT;
    v_concept_phase_status TEXT;
    v_application_type_id TEXT;
BEGIN
    -- Get the maximum phase number
    SELECT MAX(p.phase_number) INTO v_max_phase_number
    FROM demos_app.phase AS p
    WHERE p.phase_number > 0;

    -- Get the highest completed phase number
    SELECT MAX(p.phase_number) INTO v_last_completed_phase_number
    FROM demos_app.application_phase AS ap
    INNER JOIN demos_app.phase AS p ON ap.phase_id = p.id
    WHERE ap.application_id = NEW.application_id
    AND ap.phase_status_id = 'Completed';

    -- If we found a completed phase
    IF v_last_completed_phase_number IS NOT NULL THEN
        -- If it's the last phase, that's the current phase
        IF v_last_completed_phase_number = v_max_phase_number THEN
            SELECT p.id INTO v_current_phase_id
            FROM demos_app.phase AS p
            WHERE p.phase_number = v_last_completed_phase_number;
        ELSE
            -- Otherwise, the current phase is the one after the last completed
            SELECT p.id INTO v_current_phase_id
            FROM demos_app.phase AS p
            WHERE p.phase_number = v_last_completed_phase_number + 1;
        END IF;
    ELSE
        -- No completed phase found, check the Concept phase
        SELECT ap.phase_status_id INTO v_concept_phase_status
        FROM demos_app.application_phase AS ap
        INNER JOIN demos_app.phase AS p ON ap.phase_id = p.id
        WHERE ap.application_id = NEW.application_id
        AND p.id = 'Concept';

        -- If Concept is Started, it's the current phase
        IF v_concept_phase_status = 'Started' THEN
            SELECT 'Concept' INTO v_current_phase_id;
        -- If Concept is Skipped, the phase after is current
        ELSIF v_concept_phase_status = 'Skipped' THEN
            SELECT 'Application Intake' INTO v_current_phase_id;
        END IF;
    END IF;

    -- Update the appropriate table based on application type
    SELECT application_type_id INTO v_application_type_id
    FROM demos_app.application
    WHERE id = NEW.application_id;

    IF v_application_type_id = 'Demonstration' THEN
        UPDATE demos_app.demonstration
        SET current_phase_id = v_current_phase_id
        WHERE id = NEW.application_id;
    ELSIF v_application_type_id = 'Amendment' THEN
        UPDATE demos_app.amendment
        SET current_phase_id = v_current_phase_id
        WHERE id = NEW.application_id;
    ELSIF v_application_type_id = 'Extension' THEN
        UPDATE demos_app.extension
        SET current_phase_id = v_current_phase_id
        WHERE id = NEW.application_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER update_demonstration_current_phase_on_phase_update_trigger
AFTER UPDATE ON demos_app.application_phase
FOR EACH ROW
EXECUTE FUNCTION demos_app.update_demonstration_current_phase_on_phase_update();

-- update_federal_comment_phase_status
CREATE PROCEDURE demos_app.update_federal_comment_phase_status()
LANGUAGE plpgsql
AS $$
DECLARE
    phase_status_record RECORD;
BEGIN
    FOR phase_status_record IN
        WITH fed_comment_period_dates AS (
            SELECT
                application_id,
                max(CASE WHEN date_type_id = 'Federal Comment Period Start Date' THEN date_value END) AS federal_comment_start,
                max(CASE WHEN date_type_id = 'Federal Comment Period End Date' THEN date_value END) AS federal_comment_end
            FROM
                demos_app.application_date
            WHERE
                date_type_id IN ('Federal Comment Period Start Date', 'Federal Comment Period End Date')
            GROUP BY
                application_id
        ),
        phase_statuses AS (
            SELECT
                ap.application_id,
                fcpd.federal_comment_start,
                fcpd.federal_comment_end,
                max(CASE WHEN ap.phase_id = 'Federal Comment' THEN ap.phase_status_id END) AS federal_comment_phase_status,
                max(CASE WHEN ap.phase_id = 'SDG Preparation' THEN ap.phase_status_id END) AS sdg_preparation_phase_status
            FROM
                demos_app.application_phase AS ap
            INNER JOIN
                fed_comment_period_dates AS fcpd ON
                    ap.application_id = fcpd.application_id AND
                    fcpd.federal_comment_start IS NOT NULL AND
                    fcpd.federal_comment_end IS NOT NULL
            GROUP BY
                ap.application_id,
                fcpd.federal_comment_start,
                fcpd.federal_comment_end
        ),
        action_logic AS (
            SELECT
                application_id,
                federal_comment_start,
                federal_comment_end,
                federal_comment_phase_status,
                sdg_preparation_phase_status,
                CASE
                    WHEN
                        CURRENT_TIMESTAMP BETWEEN federal_comment_start AND federal_comment_end AND
                        federal_comment_phase_status = 'Not Started'
                        THEN TRUE
                    ELSE
                        FALSE
                END AS start_federal_comment_phase,
                CASE
                    WHEN
                        CURRENT_TIMESTAMP >= federal_comment_end AND
                        (federal_comment_phase_status = 'Started' OR federal_comment_phase_status = 'Not Started')
                        THEN TRUE
                    ELSE
                        FALSE
                END AS complete_federal_comment_phase,
                CASE
                    WHEN
                        CURRENT_TIMESTAMP >= federal_comment_end AND
                        (federal_comment_phase_status = 'Started' OR federal_comment_phase_status = 'Not Started') AND
                        (sdg_preparation_phase_status != 'Started')
                        THEN TRUE
                    ELSE
                        FALSE
                END AS start_sdg_prep_phase
            FROM
                phase_statuses
        )
        SELECT
            application_id,
            start_federal_comment_phase,
            complete_federal_comment_phase,
            start_sdg_prep_phase
        FROM
            action_logic
    LOOP
        IF phase_status_record.start_federal_comment_phase THEN
            UPDATE
                demos_app.application_phase
            SET
                phase_status_id = 'Started',
                updated_at = CURRENT_TIMESTAMP
            WHERE
                application_id = phase_status_record.application_id AND
                phase_id = 'Federal Comment';
        END IF;
        IF phase_status_record.complete_federal_comment_phase THEN
            UPDATE
                demos_app.application_phase
            SET
                phase_status_id = 'Completed',
                updated_at = CURRENT_TIMESTAMP
            WHERE
                application_id = phase_status_record.application_id AND
                phase_id = 'Federal Comment';
        END IF;
        IF phase_status_record.start_sdg_prep_phase THEN
            UPDATE
                demos_app.application_phase
            SET
                phase_status_id = 'Started',
                updated_at = CURRENT_TIMESTAMP
            WHERE
                application_id = phase_status_record.application_id AND
                phase_id = 'SDG Preparation';

            INSERT INTO
                demos_app.application_date
            VALUES
                (
                    phase_status_record.application_id,
                    'SDG Preparation Start Date',
                    timezone('America/New_York', date_trunc('day', timezone('America/New_York', CURRENT_TIMESTAMP))),
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
        END IF;
    END LOOP;
END;
$$;

DO $$
DECLARE
    cronjob RECORD;
BEGIN
    FOR cronjob IN
        SELECT
            jobid
        FROM
            cron.job
        WHERE
            jobname = 'nightly-update-federal-comment-phase-status'
    LOOP
        PERFORM cron.unschedule(cronjob.jobid);
    END LOOP;
END
$$;

-- Scheduled to run at 00:05 Eastern
-- Time is in UTC, so during EDT will run at 23:05 and then 00:05
-- During EST, will run at 00:05 and then 01:05
SELECT cron.schedule(
    'nightly-update-federal-comment-phase-status',
    '5 4,5 * * *',
    'CALL demos_app.update_federal_comment_phase_status();'
);
