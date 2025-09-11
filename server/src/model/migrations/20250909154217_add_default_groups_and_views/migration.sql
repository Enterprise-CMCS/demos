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

-- Utility views
-- Role assignments
DROP VIEW IF EXISTS public.vw_role_assignments;
CREATE VIEW public.vw_role_assignments WITH (security_invoker=true) AS
SELECT
    r.rolname AS parent_role,
    u.rolname AS child_role
FROM
    pg_catalog.pg_auth_members AS m
INNER JOIN
    pg_catalog.pg_roles AS r ON
        m.roleid = r.oid
INNER JOIN
    pg_catalog.pg_roles AS u ON
        m.member = u.oid
WHERE
    r.rolname NOT LIKE 'pg_%';

-- Namespace owners
DROP VIEW IF EXISTS public.vw_namespace_owners;
CREATE VIEW public.vw_namespace_owners WITH (security_invoker=true) AS
SELECT
    n.nspname AS namespace_name,
    r.rolname AS namespace_owner
FROM
    pg_catalog.pg_namespace AS n
INNER JOIN
    pg_catalog.pg_roles AS r ON
        n.nspowner = r.oid
WHERE
    n.nspname NOT LIKE 'pg_%' AND
    n.nspname != 'information_schema';

--  Relation owners
DROP VIEW IF EXISTS public.vw_relation_owners;
CREATE VIEW public.vw_relation_owners WITH (security_invoker=true) AS
SELECT
    n.nspname AS namespace_name,
    c.relname AS relation_name,
    c.relkind AS relation_kind,
    r.rolname AS relation_owner
FROM
    pg_catalog.pg_class AS c
INNER JOIN
    pg_catalog.pg_namespace AS n ON
        c.relnamespace = n.oid
INNER JOIN
    pg_catalog.pg_roles AS r ON
    c.relowner = r.oid
WHERE
    n.nspname NOT LIKE 'pg_%' AND
    n.nspname != 'information_schema';

-- Namespace grants
DROP VIEW IF EXISTS public.vw_namespace_priv_grants;
CREATE VIEW public.vw_namespace_priv_grants WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        r.rolname AS namespace_owner,
        n.nspacl AS namespace_acl
    FROM
        pg_catalog.pg_namespace AS n
    INNER JOIN
        pg_catalog.pg_roles AS r ON
            n.nspowner = r.oid
    WHERE
        n.nspname NOT LIKE 'pg_%' AND
        n.nspname != 'information_schema'
),

parsed_acls AS (
    SELECT
        n.namespace_name,
        n.namespace_owner,
        CASE
            WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee)
        END AS subject_name,
        a.privilege_type
    FROM
        namespaces AS n
    CROSS JOIN
        aclexplode(n.namespace_acl) AS a
)

SELECT
    namespace_name,
    namespace_owner,
    subject_name,
    MAX(CASE WHEN privilege_type = 'CREATE' THEN 1 ELSE 0 END) = 1 AS has_create,
    MAX(CASE WHEN privilege_type = 'USAGE' THEN 1 ELSE 0 END) = 1 AS has_usage
FROM
    parsed_acls
GROUP BY
    namespace_name,
    namespace_owner,
    subject_name;

-- Relation grants
DROP VIEW IF EXISTS public.vw_relation_priv_grants;
CREATE VIEW public.vw_relation_priv_grants WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        n.oid AS namespace_oid
    FROM
        pg_catalog.pg_namespace AS n
    WHERE
        n.nspname NOT LIKE 'pg_%'
        AND n.nspname != 'information_schema'
),

rels AS (
    SELECT
        n.namespace_name,
        c.relname AS relation_name,
        r.rolname AS relation_owner,
        c.relkind AS relation_type,
        c.relacl AS relation_acl
    FROM
        pg_catalog.pg_class AS c
    INNER JOIN
        namespaces AS n ON
            c.relnamespace = n.namespace_oid
    INNER JOIN
        pg_catalog.pg_roles AS r ON
            c.relowner = r.oid
),

parsed_acls AS (
    SELECT
        r.namespace_name,
        r.relation_name,
        r.relation_owner,
        r.relation_type,
        CASE
            WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee)
        END AS subject_name,
        a.privilege_type
    FROM
        rels AS r
    CROSS JOIN
        aclexplode(r.relation_acl) AS a
)

SELECT
    namespace_name,
    relation_name,
    relation_owner,
    relation_type,
    subject_name,
    MAX(CASE WHEN privilege_type = 'SELECT' THEN 1 ELSE 0 END) = 1 AS has_select,
    MAX(CASE WHEN privilege_type = 'INSERT' THEN 1 ELSE 0 END) = 1 AS has_insert,
    MAX(CASE WHEN privilege_type = 'UPDATE' THEN 1 ELSE 0 END) = 1 AS has_update,
    MAX(CASE WHEN privilege_type = 'DELETE' THEN 1 ELSE 0 END) = 1 AS has_delete,
    MAX(CASE WHEN privilege_type = 'TRUNCATE' THEN 1 ELSE 0 END) = 1 AS has_truncate,
    MAX(CASE WHEN privilege_type = 'REFERENCES' THEN 1 ELSE 0 END) = 1 AS has_references,
    MAX(CASE WHEN privilege_type = 'TRIGGER' THEN 1 ELSE 0 END) = 1 AS has_trigger,
    MAX(CASE WHEN privilege_type = 'MAINTAIN' THEN 1 ELSE 0 END) = 1 AS has_maintain
FROM
    parsed_acls
GROUP BY
    namespace_name,
    relation_name,
    relation_owner,
    relation_type,
    subject_name;
