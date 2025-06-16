DROP VIEW IF EXISTS public.vw_namespace_owners;
CREATE VIEW public.vw_namespace_owners WITH (security_invoker=true) AS
SELECT
    n.nspname AS namespace_name,
    u.usename AS namespace_owner
FROM
    pg_catalog.pg_namespace AS n
INNER JOIN
    pg_catalog.pg_user AS u
    ON n.nspowner = u.usesysid
WHERE
    n.nspname NOT LIKE 'pg_%'
    AND n.nspname != 'information_schema';
