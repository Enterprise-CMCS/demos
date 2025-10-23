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

-- Add utility views
-- Role assignments
CREATE VIEW public.vw_util_role_assignments WITH (security_invoker=true) AS
SELECT
    r.rolname AS parent_role,
    u.rolname AS child_role
FROM
    pg_auth_members AS m
INNER JOIN
    pg_roles AS r ON
        m.roleid = r.oid
INNER JOIN
    pg_roles AS u ON
        m.member = u.oid
WHERE
    r.rolname NOT LIKE 'pg_%';

-- Namespace owners
CREATE VIEW public.vw_util_namespace_owners WITH (security_invoker=true) AS
SELECT
    n.nspname AS namespace_name,
    r.rolname AS namespace_owner
FROM
    pg_namespace AS n
INNER JOIN
    pg_roles AS r ON
        n.nspowner = r.oid
WHERE
    n.nspname NOT LIKE 'pg_%' AND
    n.nspname != 'information_schema';

--  Relation owners
CREATE VIEW public.vw_util_relation_owners WITH (security_invoker=true) AS
SELECT
    n.nspname AS namespace_name,
    c.relname AS relation_name,
    c.relkind AS relation_kind,
    r.rolname AS relation_owner
FROM
    pg_class AS c
INNER JOIN
    pg_namespace AS n ON
        c.relnamespace = n.oid
INNER JOIN
    pg_roles AS r ON
    c.relowner = r.oid
WHERE
    n.nspname NOT LIKE 'pg_%' AND
    n.nspname != 'information_schema';

-- Namespace grants
CREATE VIEW public.vw_util_namespace_priv_grants WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        r.rolname AS namespace_owner,
        n.nspacl AS namespace_acl
    FROM
        pg_namespace AS n
    INNER JOIN
        pg_roles AS r ON
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
CREATE VIEW public.vw_util_relation_priv_grants WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        n.oid AS namespace_oid
    FROM
        pg_namespace AS n
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
        pg_class AS c
    INNER JOIN
        namespaces AS n ON
            c.relnamespace = n.namespace_oid
    INNER JOIN
        pg_roles AS r ON
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
