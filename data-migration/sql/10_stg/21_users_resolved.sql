/*
 * Purpose:    Project each PMDA-valid user into the person/users loader column set, deriving person_type from the user's role assignments.
 * Inputs:     mysql_raw.users, mysql_raw.user_role_asgnmt, mysql_raw.crosswalk_role_person_type, stg._valid_user_ids, migration._id_map_users
 * Outputs:    CREATE OR REPLACE VIEW stg.users_resolved
 * Invariants: idempotent (CREATE OR REPLACE VIEW); most-privileged person_type wins, else euaId CMS-vs-state fallback; email carried verbatim (17_filter_user guarantees present + well-formed); shared UUID from migration._id_map_users.
 * Refs:       docs/developer/reference-users-person-migration.adoc
 *
 * Staging projection of each PMDA-valid user into the column set the
 * demos_app.person and demos_app.users loaders consume. One row per
 * kept user (stg._valid_user_ids), carrying the shared UUID minted in
 * migration._id_map_users.
 *
 * See docs/developer/reference-users-person-migration.adoc for the full
 * person/users split and the Tier C schema dependencies.
 *
 * person_type_id is derived from each user's role assignment(s):
 * mysql_raw.user_role_asgnmt.role_cd -> crosswalk_role_person_type
 * (sql/04_crosswalks/42_role_person_type.sql). A user may hold several
 * roles, so the most-privileged person_type wins
 * (demos-admin > demos-cms-user > demos-state-user > non-user-contact),
 * which keeps the value inside demos_app.user_person_type_limit for any
 * account that will get a users row. A user with no role assignment falls
 * back to the euaId CMS-vs-state signal (present -> demos-cms-user,
 * absent -> demos-state-user). The 'non-user-contact' result (the external
 * evaluator role) yields a person but no users row -- the users loader
 * filters it out via user_person_type_limit.
 *
 * email is carried verbatim: 17_filter_user.sql already requires a
 * present, well-formed address, so person.email (NOT NULL) is always
 * satisfied and the value is the key CMS IDM matches on at first login.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.users_resolved AS
WITH role_person_type AS (
  -- Most-privileged person_type per user across their role assignments.
  SELECT DISTINCT ON (a.user_id)
    a.user_id,
    x.person_type_id
  FROM
    mysql_raw.user_role_asgnmt a
    JOIN mysql_raw.crosswalk_role_person_type x ON x.legacy_int_cd = a.role_cd
  ORDER BY
    a.user_id,
    CASE x.person_type_id
    WHEN 'demos-admin' THEN
      1
    WHEN 'demos-cms-user' THEN
      2
    WHEN 'demos-state-user' THEN
      3
    WHEN 'non-user-contact' THEN
      4
    ELSE
      99
    END
)
SELECT
  m.new_uuid AS new_uuid,
  COALESCE(rpt.person_type_id, CASE WHEN NULLIF(btrim(u.euaid), '') IS NOT NULL THEN
      'demos-cms-user'
    ELSE
      'demos-state-user'
    END) AS person_type_id,
  btrim(u.email) AS email,
  btrim(u.firstname) AS first_name,
  btrim(u.lastname) AS last_name,
  u.username AS username,
  u.euaid AS eua_id,
  u.datecreated::timestamptz AS created_at,
  COALESCE(u.updated_at, u.datecreated)::timestamptz AS updated_at
FROM
  mysql_raw.users u
  JOIN stg._valid_user_ids v ON v.user_id = u.id
  JOIN migration._id_map_users m ON m.legacy_int_id = u.id
  LEFT JOIN role_person_type rpt ON rpt.user_id = u.id;

