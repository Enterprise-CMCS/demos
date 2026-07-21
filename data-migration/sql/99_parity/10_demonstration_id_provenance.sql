/*
 * Purpose:    Asserts every demos_app.demonstration.id traces to a PMDA legacy row via an id-map (no UUID minted outside the id-map pattern).
 * Inputs:     demos_app.demonstration; migration._id_map_mdcd_demo; migration._id_map_mdcd_pendg_demo
 * Outputs:    migration._parity_demonstration_id_provenance
 * Invariants: Non-empty -> RED at Gate 6; plain view (no conditional-DDL guard), idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "demonstration_id_provenance" CheckResult
 *
 * Parity check: every demos_app.demonstration.id must trace to a PMDA row.
 *
 * Invariant: every UUID in demos_app.demonstration originates from a PMDA
 * legacy row via migration._id_map_mdcd_demo or
 * migration._id_map_mdcd_pendg_demo. New demonstration IDs are created
 * post-migration by the DEMOS backend and are out of scope for this
 * migration; any row found here is a migration-side bug (a transform
 * minted a UUID outside the id-map pattern, or inserted a demonstration
 * from a non-PMDA source).
 *
 * The view is consumed by migration/phases/parity.py as the
 * "demonstration_id_provenance" CheckResult. Non-empty -> RED at Gate 6.
 */
SET search_path TO demos_app, migration, public;

CREATE OR REPLACE VIEW migration._parity_demonstration_id_provenance AS
SELECT
  d.id AS demonstration_id
FROM
  demos_app.demonstration d
  LEFT JOIN migration._id_map_mdcd_demo a ON a.new_uuid = d.id
  LEFT JOIN migration._id_map_mdcd_pendg_demo p ON p.new_uuid = d.id
WHERE
  a.new_uuid IS NULL
  AND p.new_uuid IS NULL;

