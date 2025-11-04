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
