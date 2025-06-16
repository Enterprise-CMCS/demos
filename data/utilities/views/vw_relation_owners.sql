DROP VIEW IF EXISTS public.vw_relation_owners;
CREATE VIEW public.vw_relation_owners WITH (security_invoker=true) AS
WITH namespaces AS (
    SELECT
        n.nspname AS namespace_name,
        n.oid AS namespace_oid
    FROM
        pg_catalog.pg_namespace AS n
    WHERE
        n.nspname NOT LIKE 'pg_%'
        AND n.nspname != 'information_schema'
)

SELECT
    n.namespace_name,
    c.relname AS relation_name,
    u.usename AS relation_owner
FROM
    pg_catalog.pg_class AS c
INNER JOIN
    namespaces AS n
    ON c.relnamespace = n.namespace_oid
INNER JOIN pg_catalog.pg_user AS u ON
    c.relowner = u.usesysid;
