/*
 * Purpose:    Asserts every demos_app.deliverable_action row was minted by this pipeline, so a second migration writing the same table cannot double-load a deliverable's timeline unnoticed.
 * Inputs:     demos_app.deliverable_action; migration._id_map_deliverable_action; migration._id_map_mdcd_dlvrbl
 * Outputs:    migration._parity_deliverable_action_provenance
 * Invariants: Non-empty -> RED; conditional-DDL guard (created only when the target table and the id map are both present, so partial harnesses apply it as a no-op); idempotent via CREATE OR REPLACE; asserts provenance only in the target-row direction.
 * Refs:       migration/phases/parity.py "Deliverable action provenance" CheckResult; sql/23_app_derived/60_deliverable_action.sql; docs/developer/explanation-dbt-alignment.adoc#deliverable-action-both
 *
 * Parity check: deliverable_action provenance.
 *
 * demos_app.deliverable_action is written by two independent migrations. This
 * one derives its ids from migration._id_map_deliverable_action; the dbt
 * migration in data/migration/stage_pmda_for_migration mints
 * gen_random_uuid() per run and inserts with no conflict handling. The two id
 * spaces cannot overlap, so neither pipeline can see the other's rows: the
 * `NOT EXISTS ... ex.id = m.new_uuid` guard and `ON CONFLICT (id) DO NOTHING`
 * in 60_*.sql are idempotence against ourselves only.
 *
 * Nothing in the schema catches the overlap either. deliverable_action carries
 * only PRIMARY KEY (id) plus a UNIQUE (id, action_type_id) that is a primary-key
 * superset used as an FK target; there is no natural key over
 * (deliverable_id, action_type_id, action_timestamp). The
 * (action_type_id, old_status_id, new_status_id) FK into
 * deliverable_action_configuration does not catch it because both sides emit
 * legal triples. Running both therefore doubles a deliverable's timeline
 * silently, and the two halves disagree about who acted: the dbt build
 * attributes every submission to one fallback person, this one reconstructs the
 * actual uploader.
 *
 * Neither pipeline is invoked from CI, so without this check the only safeguard
 * is an operator remembering to run exactly one.
 *
 * WHAT IS ASSERTED
 *
 *   provenance  every row in demos_app.deliverable_action has its id in
 *               migration._id_map_deliverable_action.
 *
 * The reported detail separates the two ways a foreign row can arrive, because
 * they need different responses: a row on a deliverable this pipeline never
 * loaded means a parallel migration also loaded deliverables, while a row on a
 * deliverable this pipeline did load means something wrote extra actions onto
 * our own timeline.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED
 *
 * The reverse direction -- an id-map entry with no surviving row -- is not
 * checked. It holds on the current snapshot (21,605 rows against 21,605 map
 * entries, both gaps zero), but nothing in the loader guarantees a map entry is
 * always accompanied by a row: held deliverables are zero here, so the
 * held-but-mapped case is untested rather than known-absent. Asserting it would
 * risk a gate that reds on a state we have never observed. The forward direction
 * is what catches the double-load.
 *
 * Consumed by migration/phases/parity.py. Non-empty -> RED.
 *
 * Conditional DDL: guarded so a harness that stands up demos_app without ever
 * running the action loader applies this file as a clean no-op.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.deliverable_action') IS NULL OR to_regclass('migration._id_map_deliverable_action') IS NULL THEN
    RAISE NOTICE 'parity deliverable_action_provenance: target table or id map absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_action_provenance AS
    SELECT
      da.id                AS action_id,
      da.deliverable_id    AS deliverable_id,
      da.action_type_id    AS action_type_id,
      da.action_timestamp  AS action_timestamp,
      da.user_id           AS user_id,
      'action row not minted by this pipeline'::text AS reason,
      CASE WHEN EXISTS (
             SELECT 1
             FROM migration._id_map_mdcd_dlvrbl dm
             WHERE dm.new_uuid = da.deliverable_id)
        THEN 'on a deliverable this pipeline loaded'
        ELSE 'on a deliverable unknown to this pipeline (parallel migration)'
      END::text AS detail
    FROM demos_app.deliverable_action da
    WHERE NOT EXISTS (
      SELECT 1
      FROM migration._id_map_deliverable_action m
      WHERE m.new_uuid = da.id)
  $v$;
END
$$;

