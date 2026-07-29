/*
 * Purpose: Create the (empty) migration._id_map_deliverable_action table minting a stable DEMOS uuid per synthesized deliverable_action hop, keyed by (deliverable uuid, hop_seq); populated later in 23_app_derived. Idempotent.
 * Refs:    docs/developer/reference-id-maps.adoc, sql/02_seeds_static/30_deliverable_action_chain.sql, sql/23_app_derived/60_deliverable_action.sql
 *
 * Id map: (DEMOS deliverable uuid, hop_seq) -> DEMOS deliverable_action uuid.
 *
 * Unlike every other map here, the key is not a legacy id: PMDA has no
 * per-transition row to point at, so a synthesized action is identified by the
 * deliverable it belongs to plus its position in that deliverable's chain
 * (sql/02_seeds_static/30_deliverable_action_chain.sql). Keying on the DEMOS
 * uuid rather than the legacy deliverable id keeps the map aligned with what
 * actually loaded.
 *
 * This file CREATES the (empty) map only. Population lives in
 * sql/23_app_derived/60_deliverable_action.sql, which runs after 20_app: a hop
 * exists only for a deliverable that survived the load, and demos_app.deliverable
 * is not populated when 05_id_maps runs. Creating the table here keeps it
 * available by name and, more importantly, lets it persist across rebuilds so a
 * re-run mints the same action uuid for the same hop.
 */
CREATE TABLE IF NOT EXISTS migration._id_map_deliverable_action(
  deliverable_id uuid NOT NULL,
  hop_seq smallint NOT NULL,
  new_uuid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  _created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (deliverable_id, hop_seq)
);

