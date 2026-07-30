/*
 * Purpose:    Asserts every demos_app.deliverable_action row was minted by this pipeline, so a second migration writing the same table cannot double-load a deliverable's timeline unnoticed.
 * Inputs:     demos_app.deliverable_action; migration._id_map_deliverable_action; migration._id_map_mdcd_dlvrbl; mysql_raw._delta_log
 * Outputs:    migration._parity_deliverable_action_provenance
 * Invariants: Non-empty -> RED; conditional-DDL guard (created only when the target table and the id map are both present, so partial harnesses apply it as a no-op); idempotent via CREATE OR REPLACE; asserts provenance only in the target-row direction; the DEMOS past-due cron signature after the freeze instant is excluded so a post-flip re-run does not RED on legitimate app activity.
 * Refs:       migration/phases/parity.py "Deliverable action provenance" CheckResult; sql/23_app_derived/60_deliverable_action.sql; server/src/sql/functions.sql (mark_deliverables_as_past_due); docs/developer/explanation-dbt-alignment.adoc#deliverable-action-both
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
 * THE ONE EXCLUSION, AND WHY IT IS NARROW
 *
 * demos_app has a nightly cron (server/src/sql/cron_schedules.sql) calling
 * mark_deliverables_as_past_due(), which flips Upcoming -> Past Due and inserts
 * a 'Marked as Past Due' action per flipped deliverable with gen_random_uuid()
 * and user_id NULL. Those rows are legitimate DEMOS activity, not a parallel
 * migration, but they are foreign to our id map by construction. Parity runs
 * before flip so a cutover run never sees them; a post-flip re-run or
 * `migrate diagnose` would otherwise RED on them forever.
 *
 * The exclusion is therefore scoped to that cron's exact signature -- action
 * type 'Marked as Past Due', NULL actor, timestamp after the freeze instant --
 * and NOT to "everything after the freeze instant". A blanket post-freeze bound
 * would also hide the dbt migration's own marker rows, which are stamped
 * current_timestamp at load and so land after freeze too; that would open a
 * blind spot exactly where this check earns its keep. dbt's markers carry
 * 'Migrated Deliverable From PMDA' and its submission rows carry source-derived
 * timestamps, so both remain caught.
 *
 * When no freeze instant has been recorded (mysql_raw._delta_log empty, or the
 * table absent in a partial harness) nothing is excluded and the check behaves
 * exactly as before.
 *
 * Consumed by migration/phases/parity.py. Non-empty -> RED.
 *
 * Conditional DDL: guarded so a harness that stands up demos_app without ever
 * running the action loader applies this file as a clean no-op.
 */
SET search_path TO migration, demos_app, public;

DO $$
DECLARE
  -- Empty unless mysql_raw._delta_log exists to supply a freeze instant, so a
  -- harness without the delta log still gets the unbounded (original) check.
  past_due_cron_exclusion text := '';
BEGIN
  IF to_regclass('demos_app.deliverable_action') IS NULL OR to_regclass('migration._id_map_deliverable_action') IS NULL THEN
    RAISE NOTICE 'parity deliverable_action_provenance: target table or id map absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw._delta_log') IS NOT NULL THEN
    past_due_cron_exclusion := $x$
      AND NOT (da.action_type_id = 'Marked as Past Due'
        AND da.user_id IS NULL
        AND da.action_timestamp > COALESCE((
          SELECT
            max(dl.freeze_instant)
          FROM mysql_raw._delta_log dl), 'infinity'::timestamptz)) $x$;
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
  $v$ || past_due_cron_exclusion;
END
$$;

