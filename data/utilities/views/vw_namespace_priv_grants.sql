DROP VIEW IF EXISTS public.vw_namespace_priv_grants;
CREATE VIEW public.vw_namespace_priv_grants WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        u.usename AS namespace_owner,
        n.nspacl AS namespace_acl
    FROM
        pg_catalog.pg_namespace AS n
    INNER JOIN
        pg_catalog.pg_user AS u
        ON n.nspowner = u.usesysid
    WHERE
        n.nspname NOT LIKE 'pg_%'
        AND n.nspname != 'information_schema'
),

parsed_group_acls AS (
    SELECT
        n.namespace_name,
        n.namespace_owner,
        g.groname AS subject,
        'group' AS subject_type,
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(n.namespace_acl, '|'), 'group ' || g.groname || '=', 2), '/', 1) AS granted_privs
    FROM
        namespaces AS n
    CROSS JOIN pg_catalog.pg_group AS g
    WHERE
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(n.namespace_acl, '|'), 'group ' || g.groname || '=', 2), '/', 1) != ''
),

parsed_user_acls AS (
    SELECT
        n.namespace_name,
        n.namespace_owner,
        u.usename AS subject,
        'user' AS subject_type,
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(n.namespace_acl, '|'), u.usename || '=', 2), '/', 1) AS granted_privs
    FROM
        namespaces AS n
    CROSS JOIN pg_catalog.pg_user AS u
    WHERE
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(n.namespace_acl, '|'), u.usename || '=', 2), '/', 1) != ''
)

SELECT
    namespace_name,
    namespace_owner,
    subject,
    subject_type,
    POSITION('C' IN granted_privs) > 0 AS has_create,
    POSITION('U' IN granted_privs) > 0 AS has_usage
FROM
    parsed_group_acls
UNION ALL
SELECT
    namespace_name,
    namespace_owner,
    subject,
    subject_type,
    POSITION('C' IN granted_privs) > 0 AS has_create,
    POSITION('U' IN granted_privs) > 0 AS has_usage
FROM
    parsed_user_acls;
