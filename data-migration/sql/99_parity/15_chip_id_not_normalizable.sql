/*
 * Purpose:    Durable per-row log of legacy CHIP numbers the migration would not carry into demonstration.chip_id (unnormalizable, so the mint trigger issues a fresh one instead).
 * Inputs:     stg.demonstration_resolved
 * Outputs:    migration._parity_chip_id_not_normalizable
 * Invariants: NON-GATING (a dropped legacy CHIP id costs a preserved number, never correctness -- the trigger mints a valid replacement); conditional-DDL guard (created only when stg.demonstration_resolved is present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "Legacy CHIP numbers not preserved"); sql/00_init/03_helper_fns.sql (migration.normalize_chip_id); sql/20_app/30_demonstration.sql (chip_id_number_seq floor + insert)
 *
 * Parity check 15: legacy CHIP numbers that could not be preserved.
 *
 * mdcd_scndry_demo_num is a free-text column and the migration used to pass it
 * to demos_app.demonstration.chip_id after nothing more than a btrim. The live
 * source shows why that is unsafe: besides well-formed 21-W numbers the column
 * also carries the literal string 'None' and at least one MEDICAID number
 * (11-W-...) misfiled into the CHIP field. Either would have been written into
 * chip_id verbatim, producing a demonstration whose CHIP id is not a CHIP id.
 *
 * chip_id_legacy is therefore normalized (migration.normalize_chip_id, which
 * accepts only the 21-W prefix) and an unnormalizable value becomes NULL, which
 * makes the generate_medicaid_chip_id_numbers trigger mint a fresh, valid CHIP
 * number at INSERT. That is a safe outcome, not a lossless one: the legacy
 * number is not preserved, so each dropped value is logged here for SME review
 * and possible source correction before cutover.
 *
 * NON-GATING by design. A dropped legacy CHIP id cannot make the target
 * incorrect -- the row still gets a valid minted id -- so it is a review item,
 * not a build blocker. (Contrast the medicaid_id rules, which DO gate: there the
 * unnormalizable value is the demonstration's identity and the row is dropped.)
 *
 * Conditional DDL: reads stg.demonstration_resolved, which exists only in the
 * full pipeline, so the view is guarded and the app-layers idempotency harness
 * applies this file as a clean no-op.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity chip_id_not_normalizable: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_chip_id_not_normalizable AS
    SELECT
      r.new_uuid        AS demonstration_id,
      r.legacy_demo_id  AS legacy_demo_id,
      r.state_id        AS state_id,
      r.medicaid_id     AS medicaid_id,
      r.chip_id_source  AS chip_id_source,
      CASE
        WHEN migration.normalize_medicaid_id(r.chip_id_source) IS NOT NULL
          THEN 'a Medicaid (11-W) number is filed in the CHIP column'
        WHEN upper(btrim(r.chip_id_source)) IN ('NONE', 'N/A', 'NA', 'NULL')
          THEN 'placeholder text, not a CHIP number'
        ELSE 'not normalizable to 21-W-NNNNN/R'
      END               AS reason
    FROM stg.demonstration_resolved r
    WHERE r.chip_id_source IS NOT NULL
      AND r.chip_id_legacy IS NULL;
  $v$;
END
$$;

