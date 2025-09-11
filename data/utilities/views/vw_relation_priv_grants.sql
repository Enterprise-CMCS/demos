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
        u.usename AS relation_owner,
        c.relacl AS relation_acl
    FROM
        pg_catalog.pg_class AS c
    INNER JOIN
        namespaces AS n
        ON c.relnamespace = n.namespace_oid
    INNER JOIN
        pg_catalog.pg_user AS u
        ON c.relowner = u.usesysid
),

parsed_group_acls AS (
    SELECT
        r.namespace_name,
        r.relation_name,
        r.relation_owner,
        g.groname AS subject,
        'group' AS subject_type,
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(r.relation_acl, '|'), 'group ' || g.groname || '=', 2), '/', 1) AS granted_privs
    FROM
        rels AS r
    CROSS JOIN pg_catalog.pg_group AS g
    WHERE
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(r.relation_acl, '|'), 'group ' || g.groname || '=', 2), '/', 1) != ''
),

parsed_user_acls AS (
    SELECT
        r.namespace_name,
        r.relation_name,
        r.relation_owner,
        u.usename AS subject,
        'user' AS subject_type,
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(r.relation_acl, '|'), u.usename || '=', 2), '/', 1) AS granted_privs
    FROM
        rels AS r
    CROSS JOIN pg_catalog.pg_user AS u
    WHERE
        SPLIT_PART(SPLIT_PART(ARRAY_TO_STRING(r.relation_acl, '|'), u.usename || '=', 2), '/', 1) != ''
)

SELECT
    namespace_name,
    relation_name,
    relation_owner,
    subject,
    subject_type,
    POSITION('r' IN granted_privs) > 0 AS has_select,
    POSITION('a' IN granted_privs) > 0 AS has_insert,
    POSITION('w' IN granted_privs) > 0 AS has_update,
    POSITION('d' IN granted_privs) > 0 AS has_delete,
    POSITION('D' IN granted_privs) > 0 AS has_truncate,
    POSITION('x' IN granted_privs) > 0 AS has_references,
    POSITION('t' IN granted_privs) > 0 AS has_trigger,
    POSITION('m' IN granted_privs) > 0 AS has_maintain
FROM
    parsed_group_acls
UNION ALL
SELECT
    namespace_name,
    relation_name,
    relation_owner,
    subject,
    subject_type,
    POSITION('r' IN granted_privs) > 0 AS has_select,
    POSITION('a' IN granted_privs) > 0 AS has_insert,
    POSITION('w' IN granted_privs) > 0 AS has_update,
    POSITION('d' IN granted_privs) > 0 AS has_delete,
    POSITION('D' IN granted_privs) > 0 AS has_truncate,
    POSITION('x' IN granted_privs) > 0 AS has_references,
    POSITION('t' IN granted_privs) > 0 AS has_trigger,
    POSITION('m' IN granted_privs) > 0 AS has_maintain
FROM
    parsed_user_acls;
