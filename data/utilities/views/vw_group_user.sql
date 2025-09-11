DROP VIEW IF EXISTS public.vw_group_user;
CREATE VIEW public.vw_group_user WITH (security_invoker=true) AS
SELECT
    u.usename AS user_name,
    g.groname AS group_name
FROM
    pg_catalog.pg_user AS u
CROSS JOIN
    pg_catalog.pg_group AS g
WHERE
    u.usesysid = ANY(g.grolist);
