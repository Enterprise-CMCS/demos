-- Drop existing utility views (prefixed with vw_util_)
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT
            n.nspname as schema_name,
            c.relname as view_name
        FROM
            pg_class AS c
        INNER JOIN
            pg_namespace AS n ON
                c.relnamespace = n.oid
        WHERE
            c.relkind = 'v'
            AND n.nspname IN ('public', 'demos_app')
            AND c.relname LIKE 'vw_util_%'
    LOOP
        EXECUTE format('DROP VIEW %I.%I;', view_record.schema_name, view_record.view_name);
        RAISE NOTICE 'Dropped view %.%', view_record.schema_name, view_record.view_name;
    END LOOP;
END
$$;
