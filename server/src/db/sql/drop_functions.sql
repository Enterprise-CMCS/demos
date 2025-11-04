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
