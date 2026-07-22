/*
 * Purpose: Create the (empty) migration._id_map_mdcd_pendg_demo table mapping legacy mdcd_pendg_demo.mdcd_pendg_demo_id to a minted DEMOS uuid; populated later in 10_stg. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, reports/narrative/pending_approved_decisions.md
 *
 * Id map: legacy mysql_raw.mdcd_pendg_demo.mdcd_pendg_demo_id (int) ->
 * DEMOS uuid. See docs/developer/reference-id-maps.adoc.
 *
 * Creation only; population lives in
 * sql/10_stg/19_populate_id_map_mdcd_pendg_demo.sql (see the sibling
 * 10_mdcd_demo.sql header for why population is deferred to 10_stg).
 *
 * Per reports/narrative/pending_approved_decisions.md, a pending demo that folds
 * into an approved counterpart REUSES the approved UUID at the
 * demonstration transform (P2); only orphan-pending rows take a UUID
 * from this map. This file mints one UUID per PMDA-valid pending id; the
 * fold/reuse logic is applied downstream, not here.
 */
CREATE TABLE IF NOT EXISTS migration._id_map_mdcd_pendg_demo(
  legacy_int_id bigint PRIMARY KEY,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now()
);

