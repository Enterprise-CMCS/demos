/*
 * Purpose:    Project the explicit per-(person, state) authorization grants for non-CMS users and surface all-states/unmapped anomalies for SME review.
 * Inputs:     stg.users_resolved, migration._id_map_users, mysql_raw.user_authrzd_state_acs, mysql_raw.crosswalk_state
 * Outputs:    CREATE OR REPLACE VIEW stg.person_state_resolved, stg.person_state_flags
 * Invariants: source-only (mysql_raw + migration + stg); idempotent (CREATE OR REPLACE VIEW); CMS users/admins NOT projected here (loader fans them across all states); 'XX' all-states and unmapped codes are held in stg.person_state_flags, never silently granted (parity check 10).
 * Refs:       -
 *
 * Staging projection for demos_app.person_state, the per-(person, state)
 * authorization grant. Source-only (mysql_raw + migration + stg), consumed by
 * sql/23_app_derived/10_person_state.sql.
 *
 * This view carries ONLY the explicit grants for non-CMS users (state users
 * and any other non-CMS person_type): one row per authorized state, resolved
 * through the SME state crosswalk and excluding the 'XX' (all-states)
 * sentinel. CMS users and admins are NOT projected here -- the loader fans
 * them out across every demos_app.state row, mirroring the DEMOS
 * assign_cms_user_to_all_states trigger (DEMOS reserves all-states for CMS).
 *
 * Anomalies that must NOT silently become a grant are surfaced in
 * stg.person_state_flags for SME review (parity check 10):
 *   - a non-CMS user authorized for 'XX' (all states): DEMOS does not grant a
 *     state user all states, so it is held, not expanded;
 *   - a non-'XX' code that does not resolve to a known DEMOS state (junk /
 *     retired code).
 *
 * person_id is the shared UUID minted in migration._id_map_users (= person.id
 * = users.id). person_type comes from stg.users_resolved (the role-derived
 * value), so the CMS-vs-state split here matches the loaded person row.
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.person_state_resolved AS SELECT DISTINCT
  r.new_uuid AS person_id,
  cs.demos_text_id AS state_id
FROM
  stg.users_resolved r
  JOIN migration._id_map_users m ON m.new_uuid = r.new_uuid
  JOIN mysql_raw.user_authrzd_state_acs uasa ON uasa.user_id = m.legacy_int_id
  JOIN mysql_raw.crosswalk_state cs ON cs.legacy_cd = uasa.geo_ansi_state_cd
WHERE
  r.person_type_id NOT IN ('demos-admin', 'demos-cms-user')
  AND uasa.geo_ansi_state_cd <> 'XX';

CREATE OR REPLACE VIEW stg.person_state_flags AS
SELECT
  m.legacy_int_id AS user_id,
  r.new_uuid AS person_id,
  r.email AS email,
  uasa.geo_ansi_state_cd AS state_cd,
  'state_user_all_states_XX' AS reason
FROM
  stg.users_resolved r
  JOIN migration._id_map_users m ON m.new_uuid = r.new_uuid
  JOIN mysql_raw.user_authrzd_state_acs uasa ON uasa.user_id = m.legacy_int_id
WHERE
  r.person_type_id NOT IN ('demos-admin', 'demos-cms-user')
  AND uasa.geo_ansi_state_cd = 'XX'
UNION ALL
SELECT
  m.legacy_int_id,
  r.new_uuid,
  r.email,
  uasa.geo_ansi_state_cd,
  'uasa_state_code_unmapped'
FROM
  stg.users_resolved r
  JOIN migration._id_map_users m ON m.new_uuid = r.new_uuid
  JOIN mysql_raw.user_authrzd_state_acs uasa ON uasa.user_id = m.legacy_int_id
WHERE
  r.person_type_id NOT IN ('demos-admin', 'demos-cms-user')
  AND uasa.geo_ansi_state_cd <> 'XX'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      mysql_raw.crosswalk_state cs
    WHERE
      cs.legacy_cd = uasa.geo_ansi_state_cd);

