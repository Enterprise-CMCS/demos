/*
 * Purpose:    Project each PMDA-valid amendment into the column set the demos_app.application + amendment loader consumes.
 * Inputs:     mysql_raw.mdcd_demo_amndmt, stg._valid_amndmt_ids, migration._id_map_mdcd_demo_amndmt, migration._id_map_mdcd_demo
 * Outputs:    CREATE OR REPLACE VIEW stg.amendment_resolved
 * Invariants: source-only (mysql_raw + id maps only; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); soft-delete exclusion (dltd_ind = 1); demo_uuid resolves only via the approved parent (pending-only amendments get NULL, held by the loader).
 * Refs:       docs/specs/pmda-cross-cutting-derivation-spec.md
 *
 * Staging projection of each PMDA-valid amendment (mysql_raw.mdcd_demo_amndmt)
 * into the column set the demos_app.application + demos_app.amendment loader
 * consumes (sql/20_app/35_amendment.sql). One row per kept amendment
 * (stg._valid_amndmt_ids), carrying the shared UUID minted in
 * migration._id_map_mdcd_demo_amndmt.
 *
 * Source-only by design: references ONLY mysql_raw source tables and the id
 * maps -- never the crosswalks (04) or seeds (02) -- so it builds in the
 * stg-only idempotency harness (tests/sql/test_stg_idempotency.py). The status
 * crosswalk, the status-derived current_phase_id, and the signature OA/OCD-else-
 * NULL rule all live in the loader, which runs after crosswalks + seeds.
 *
 * Parentage: an amendment carries BOTH mdcd_demo_id (approved parent) and
 * mdcd_pendg_demo_id (pending parent); there is no separate pending amendment
 * table (see 13_filter_amndmt.sql). DEMOS amendment.demonstration_id is NOT
 * NULL and points at a loaded demonstration. The pending parent is a row in the
 * separate mdcd_pendg_demo table, which the demonstration loader does not read
 * and which has no id map. So demo_uuid resolves only via the
 * APPROVED parent (migration._id_map_mdcd_demo); pending-only amendments get a
 * NULL demo_uuid and are held back by the loader's JOIN to demos_app.demonstration
 * (logged non-gating by sql/99_parity/52). Likewise, an approved parent that was
 * itself held back cascades out at that JOIN.
 *
 * No updated-at column exists on mdcd_demo_amndmt (only creatd_dt), so the
 * loader sets created_at = updated_at = status_updated_at = creatd_dt, matching
 * the DEMOS migration that backfilled status_updated_at = updated_at.
 *
 * Soft deletes (dltd_ind = 1) are excluded: amendment has no target "Deleted"
 * lifecycle state (deferred SME decision, pmda-cross-cutting-derivation-spec.md).
 */
SET search_path TO stg, mysql_raw, migration, public;

CREATE OR REPLACE VIEW stg.amendment_resolved AS
SELECT
  am.new_uuid AS new_uuid,
  dm.new_uuid AS demo_uuid,
  btrim(a.mdcd_demo_amndmt_name) AS name,
  NULLIF(btrim(a.amndmt_desc), '') AS description,
  a.mdcd_demo_amndmt_stus_cd::int AS status_cd,
  a.mdcd_demo_aplctn_sgntr_lvl_cd::int AS signature_cd,
  a.amndmt_prd_from_dt::timestamptz AS effective_date,
  a.creatd_dt::timestamptz AS created_at,
  a.creatd_dt::timestamptz AS updated_at
FROM
  mysql_raw.mdcd_demo_amndmt a
  JOIN stg._valid_amndmt_ids v ON v.amndmt_id = a.mdcd_demo_amndmt_id
  JOIN migration._id_map_mdcd_demo_amndmt am ON am.legacy_int_id = a.mdcd_demo_amndmt_id
  LEFT JOIN migration._id_map_mdcd_demo dm ON dm.legacy_int_id = a.mdcd_demo_id
WHERE (a.dltd_ind)::int IS DISTINCT FROM 1;

