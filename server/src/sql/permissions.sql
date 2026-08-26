-- Easy way to revoke schema permissions
CREATE OR REPLACE FUNCTION revoke_all_on_schema(schema_name TEXT, user_name TEXT) 
RETURNS VOID
AS $$
DECLARE
    proper_user_name TEXT;
BEGIN
    -- Handle passing in the PUBLIC user
    IF upper(user_name) = 'PUBLIC' THEN
        proper_user_name := 'PUBLIC';
    ELSE
        proper_user_name := format('%I', user_name);
    END IF;

    -- Revoke privileges on the schema itself
    EXECUTE format('REVOKE ALL PRIVILEGES ON SCHEMA %I FROM %s', schema_name, proper_user_name);

    -- Revoke privileges on objects within the schema
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I FROM %s', schema_name, proper_user_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I FROM %s', schema_name, proper_user_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA %I FROM %s', schema_name, proper_user_name);

    -- Revoke default privileges
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM %s', schema_name, proper_user_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON SEQUENCES FROM %s', schema_name, proper_user_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON FUNCTIONS FROM %s', schema_name, proper_user_name);
END;
$$ LANGUAGE plpgsql;

-- Create the legacy_pmda schemas if not exists
-- Helps to avoid permission issues later for lower environments where they don't exist
CREATE SCHEMA IF NOT EXISTS legacy_pmda_raw;
CREATE SCHEMA IF NOT EXISTS legacy_pmda_staged;

-- Revoke all access by user / role
-- PUBLIC revocations
SELECT revoke_all_on_schema('public', 'PUBLIC');
SELECT revoke_all_on_schema('demos_app', 'PUBLIC');
SELECT revoke_all_on_schema('cron', 'PUBLIC');
SELECT revoke_all_on_schema('legacy_pmda_raw', 'PUBLIC');
SELECT revoke_all_on_schema('legacy_pmda_staged', 'PUBLIC');

-- demos_read revocations
SELECT revoke_all_on_schema('public', 'demos_read');
SELECT revoke_all_on_schema('demos_app', 'demos_read');
SELECT revoke_all_on_schema('cron', 'demos_read');
SELECT revoke_all_on_schema('legacy_pmda_raw', 'demos_read');
SELECT revoke_all_on_schema('legacy_pmda_staged', 'demos_read');

-- demos_write revocations
SELECT revoke_all_on_schema('public', 'demos_write');
SELECT revoke_all_on_schema('demos_app', 'demos_write');
SELECT revoke_all_on_schema('cron', 'demos_write');
SELECT revoke_all_on_schema('legacy_pmda_raw', 'demos_write');
SELECT revoke_all_on_schema('legacy_pmda_staged', 'demos_write');

-- demos_delete revocations
SELECT revoke_all_on_schema('public', 'demos_delete');
SELECT revoke_all_on_schema('demos_app', 'demos_delete');
SELECT revoke_all_on_schema('cron', 'demos_delete');
SELECT revoke_all_on_schema('legacy_pmda_raw', 'demos_delete');
SELECT revoke_all_on_schema('legacy_pmda_staged', 'demos_delete');

-- Next, do grants per user / role
-- Usage on schemas (and one on sequences), specific table access, change default privs
-- PUBLIC grants
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC;

-- demos_read grants
GRANT USAGE ON SCHEMA demos_app TO demos_read;
GRANT USAGE ON SCHEMA cron TO demos_read;
GRANT USAGE ON SCHEMA legacy_pmda_raw TO demos_read;
GRANT USAGE ON SCHEMA legacy_pmda_staged TO demos_read;

GRANT SELECT ON ALL TABLES IN SCHEMA demos_app TO demos_read;
GRANT SELECT ON ALL TABLES IN SCHEMA cron TO demos_read;
GRANT SELECT ON ALL TABLES IN SCHEMA legacy_pmda_raw TO demos_read;
GRANT SELECT ON ALL TABLES IN SCHEMA legacy_pmda_staged TO demos_read;

ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT SELECT ON TABLES TO demos_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA cron GRANT SELECT ON TABLES TO demos_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA legacy_pmda_raw GRANT SELECT ON TABLES TO demos_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA legacy_pmda_staged GRANT SELECT ON TABLES TO demos_read;

-- demos_write grants
GRANT USAGE ON SCHEMA demos_app TO demos_write;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA demos_app TO demos_write;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA demos_app TO demos_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT INSERT, UPDATE ON TABLES TO demos_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT USAGE ON SEQUENCES TO demos_write;

-- demos_delete grants
GRANT USAGE ON SCHEMA demos_app TO demos_delete;
GRANT DELETE ON ALL TABLES IN SCHEMA demos_app TO demos_delete;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT DELETE ON TABLES TO demos_delete;

-- Clean up utility function
DROP FUNCTION revoke_all_on_schema;
