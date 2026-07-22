/*
 * Purpose:    Mint a stable UUID per PMDA-valid pending-demonstration id into the pending-demo id map.
 * Inputs:     stg._valid_pendg_demo_ids
 * Outputs:    INSERT INTO migration._id_map_mdcd_pendg_demo (ON CONFLICT DO NOTHING)
 * Invariants: source-only (reads only the valid-ids view); idempotent via ON CONFLICT DO NOTHING (rebuild stability); pending/approved UUID fold applied at the demonstration transform (P2), not here.
 * Refs:       docs/developer/reference-id-maps.adoc, reports/narrative/pending_approved_decisions.md
 *
 * Populate migration._id_map_mdcd_pendg_demo from PMDA-valid pending
 * demonstration ids (stg._valid_pendg_demo_ids, defined in
 * 11_filter_pendg_demo.sql).
 *
 * Mints one UUID per valid pending id. The pending/approved fold (a
 * pending row reusing its approved counterpart's UUID) is applied at the
 * demonstration transform (P2), not here; this map only guarantees every
 * orphan-pending row has a stable UUID. ON CONFLICT DO NOTHING for
 * rebuild stability. See docs/developer/reference-id-maps.adoc and
 * reports/narrative/pending_approved_decisions.md.
 */
SET search_path TO stg, migration, mysql_raw, public;

INSERT INTO migration._id_map_mdcd_pendg_demo(legacy_int_id)
SELECT
  demo_id
FROM
  stg._valid_pendg_demo_ids
ON CONFLICT
  DO NOTHING;

