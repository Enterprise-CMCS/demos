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
