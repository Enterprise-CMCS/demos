/*
 * Purpose:    Asserts every PMDA-valid resolved demonstration that is not a recorded hold-back is materialized in demos_app.demonstration.
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division; migration.state_region; demos_app.demonstration
 * Outputs:    migration._parity_demonstration_completeness
 * Invariants: Non-empty -> RED at Gate 6; excludes the two recorded loader hold-backs (Approved missing-field, and the non-winning row of a duplicate medicaid_id) so a deliberate hold-back never trips this gate; conditional-DDL guard (created only when stg.demonstration_resolved + the crosswalks + state_region are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py "8. Demonstration load completeness" CheckResult; completeness counterpart to _parity_demonstration_id_provenance
 *
 * Parity check 8: demonstration load completeness (blocked / unloaded demos).
 *
 * Invariant: every PMDA-valid demonstration resolved by the staging view
 * stg.demonstration_resolved (10_stg/22_*) is materialized in
 * demos_app.demonstration by the loader (sql/20_app/30_demonstration.sql). A
 * row in this view is a resolved demo the loader could NOT place. In any build
 * that reaches parity every legacy status code is already crosswalked -- the
 * 11_demo_status_check hard gate fails `migrate crosswalks` on any status code
 * absent from crosswalk_demo_status upstream (code 1 'Pending' is now mapped to
 * 'Under Review' per D1) -- so the residual cause is an unresolvable state:
 * the loader inner-joins migration.state_region to mint the 21-W chip region,
 * so a demo with a NULL / unmapped geo_ansi_state_cd is silently held back with
 * only a build NOTICE. This view makes that gap durable and fail-closed.
 *
 * Consumed by migration/phases/parity.py as the
 * "8. Demonstration load completeness" CheckResult. Non-empty -> RED at Gate 6.
 * It is the completeness counterpart to _parity_demonstration_id_provenance
 * (which guards the reverse direction): together they assert a bijection
 * between the resolved PMDA source set and demos_app.demonstration.
 *
 * Conditional DDL: the view reads stg.demonstration_resolved, which exists only
 * in the full pipeline (build_stg onward) and never in the app-layers
 * idempotency harness (tests/sql/test_app_layers_idempotency.py) that stands up
 * demos_app + the id maps with no mysql_raw / stg. We therefore CREATE the view
 * only when the staging view is present; the harness applies this file as a
 * clean no-op (the view is simply absent, so test_parity_views_empty does not
 * assert on it), and re-apply is idempotent via CREATE OR REPLACE. run_parity
 * applies 99_parity after build, where the staging view exists.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity demonstration_completeness: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_demo_status') IS NULL THEN
    RAISE NOTICE 'parity demonstration_completeness: mysql_raw.crosswalk_demo_status absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_sdg_division') IS NULL THEN
    RAISE NOTICE 'parity demonstration_completeness: mysql_raw.crosswalk_sdg_division absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration.state_region') IS NULL THEN
    RAISE NOTICE 'parity demonstration_completeness: migration.state_region absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_completeness AS
    SELECT r.new_uuid    AS demonstration_id,
           r.medicaid_id AS medicaid_id,
           r.state_id    AS state_id,
           r.status_cd   AS status_cd
      FROM stg.demonstration_resolved r
      LEFT JOIN mysql_raw.crosswalk_demo_status cw     ON cw.legacy_int_cd = r.status_cd
      LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv  ON xdiv.legacy_int_cd = r.sdg_division_cd
      LEFT JOIN migration.state_region sr              ON sr.state_id = r.state_id
     WHERE NOT EXISTS (
             SELECT 1 FROM demos_app.demonstration d WHERE d.id = r.new_uuid
           )
       -- Exclude deliberate, recorded hold-backs (logged by parity check 13,
       -- migration._parity_approved_demo_held): an Approved demo missing a
       -- CHECK-required field (sdg_division/effective/expiration) is
       -- intentionally not loaded, so it is not a completeness anomaly here.
       AND NOT (
             cw.demos_text_id = 'Approved'
             AND (xdiv.demos_text_id IS NULL OR r.effective_date IS NULL OR r.expiration_date IS NULL)
           )
       -- Exclude deliberate dup-medicaid_id hold-backs (RED-4; logged by parity
       -- check 21, migration._parity_demonstration_held_dup_medicaid_id): the
       -- non-winning row of a shared medicaid_id is intentionally not loaded, so
       -- it is not a completeness anomaly. Winner rule mirrors the loader
       -- (region-suffix match, then lowest legacy id).
       AND NOT (
             r.medicaid_id IS NOT NULL
             AND EXISTS (
               SELECT 1
               FROM stg.demonstration_resolved r2
               JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
               JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
               LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
               WHERE r2.medicaid_id = r.medicaid_id
                 AND r2.new_uuid <> r.new_uuid
                 AND NOT (cw2.demos_text_id = 'Approved'
                   AND (xd2.demos_text_id IS NULL OR r2.effective_date IS NULL OR r2.expiration_date IS NULL))
                 AND (CASE WHEN substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                       AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                         OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0' AND sr2.region = 10))
                       THEN 0 ELSE 1 END, r2.legacy_demo_id)
                   < (CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                       AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
                         OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
                       THEN 0 ELSE 1 END, r.legacy_demo_id))
           );
  $v$;
END
$$;

