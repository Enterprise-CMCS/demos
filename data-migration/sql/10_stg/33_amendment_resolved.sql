/*
 * Purpose:    Project each PMDA-valid amendment into the column set the demos_app.application + amendment loader consumes.
 * Inputs:     mysql_raw.mdcd_demo_amndmt, stg._valid_amndmt_ids, migration._id_map_mdcd_demo_amndmt, migration._id_map_mdcd_demo
 * Outputs:    CREATE OR REPLACE VIEW stg.amendment_resolved
 * Invariants: source-only (mysql_raw + id maps + the source-only stg._pendg_demo_fold view; never crosswalks 04 / seeds 02) so it builds in the stg-only idempotency harness; idempotent (CREATE OR REPLACE VIEW); soft-delete exclusion (dltd_ind = 1); demo_uuid resolves via the approved parent, else the fold-aware pending parent (a truly parentless amendment gets NULL, held by the loader); parent_is_pending flags a pending-track amendment so the loader can assign 'Under Review' to the statusless ones.
 * Refs:       docs/developer/reference-cross-cutting-derivations.adoc
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
 * NULL and points at a loaded demonstration. "Approved wins": demo_uuid resolves
 * first via the APPROVED parent (migration._id_map_mdcd_demo) and, when there is
 * none, via the fold-aware PENDING parent (stg._pendg_demo_fold.demo_uuid, which
 * is the approved counterpart UUID for a folded pending demo, else the orphan
 * pending demo's own UUID). A truly parentless amendment (neither parent
 * resolves) gets a NULL demo_uuid and is held back by the loader's JOIN to
 * demos_app.demonstration (logged non-gating by sql/99_parity/52); likewise a
 * pending or approved parent that was itself held back cascades out at that JOIN.
 *
 * parent_is_pending marks an amendment resolved through the pending parent (no
 * approved parent). The pending demonstrations carry NO source status, so the
 * loader assigns 'Under Review' to a pending-track amendment whose source status
 * is NULL; a pending-track amendment that DOES carry a status maps through the
 * crosswalk as usual. NOTE: in the current source every kept amendment resolves
 * via an approved parent (0 pending-track), so the statusless amendments (162
 * this run) are approved-track and are dropped fail-closed (RED-D, logged by
 * 99_parity/52), not defaulted to 'Under Review' here.
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
  COALESCE(dm.new_uuid, pf.demo_uuid) AS demo_uuid,
  (dm.new_uuid IS NULL
    AND pf.demo_uuid IS NOT NULL) AS parent_is_pending,
  btrim(a.mdcd_demo_amndmt_name) AS name,
  NULLIF(btrim(a.amndmt_desc), '') AS description,
  a.mdcd_demo_amndmt_stus_cd::int AS status_cd,
  a.mdcd_demo_aplctn_sgntr_lvl_cd::int AS signature_cd,
  migration.eastern_day_start(a.amndmt_prd_from_dt) AS effective_date,
  a.creatd_dt::timestamptz AS created_at,
  a.creatd_dt::timestamptz AS updated_at
FROM
  mysql_raw.mdcd_demo_amndmt a
  JOIN stg._valid_amndmt_ids v ON v.amndmt_id = a.mdcd_demo_amndmt_id
  JOIN migration._id_map_mdcd_demo_amndmt am ON am.legacy_int_id = a.mdcd_demo_amndmt_id
  LEFT JOIN migration._id_map_mdcd_demo dm ON dm.legacy_int_id = a.mdcd_demo_id
  LEFT JOIN stg._pendg_demo_fold pf ON pf.legacy_pendg_demo_id = a.mdcd_pendg_demo_id
WHERE (a.dltd_ind)::int IS DISTINCT FROM 1;

