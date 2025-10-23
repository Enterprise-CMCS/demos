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

-- Permission settings
-- Revoke all access to start
SELECT revoke_all_on_schema('public', 'PUBLIC');
SELECT revoke_all_on_schema('demos_app', 'PUBLIC');
SELECT revoke_all_on_schema('public', 'demos_read');
SELECT revoke_all_on_schema('demos_app', 'demos_read');
SELECT revoke_all_on_schema('public', 'demos_write');
SELECT revoke_all_on_schema('demos_app', 'demos_write');
SELECT revoke_all_on_schema('public', 'demos_delete');
SELECT revoke_all_on_schema('demos_app', 'demos_delete');

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA demos_app TO demos_read;
GRANT USAGE ON SCHEMA demos_app TO demos_write;
GRANT USAGE ON SCHEMA demos_app TO demos_delete;

-- Give table access appropriately
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA demos_app TO demos_read;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA demos_app TO demos_write;
GRANT DELETE ON ALL TABLES IN SCHEMA demos_app TO demos_delete;

-- Grant sequence usage for writing
GRANT USAGE ON ALL SEQUENCES IN SCHEMA demos_app TO demos_write;

-- Update default privileges for future tables / drops and reloads
-- Eventually, all alter default privileges commands need to be executed by the table owners
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT SELECT ON TABLES TO demos_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT INSERT, UPDATE ON TABLES TO demos_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT DELETE ON TABLES TO demos_delete;
ALTER DEFAULT PRIVILEGES IN SCHEMA demos_app GRANT USAGE ON SEQUENCES TO demos_write;

-- Clean up utility function
DROP FUNCTION revoke_all_on_schema;
