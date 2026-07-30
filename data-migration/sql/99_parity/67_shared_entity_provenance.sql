/*
 * Purpose:    Count, per shared demos_app entity, the rows this pipeline did not mint, so a parallel migration writing the same database is visible in one place rather than only on the deliverable_action gate.
 * Inputs:     demos_app.person, users, demonstration, application, deliverable, deliverable_action; migration._id_map_users, _id_map_mdcd_demo, _id_map_mdcd_pendg_demo, _id_map_mdcd_demo_amndmt, _id_map_mdcd_dlvrbl, _id_map_deliverable_action
 * Outputs:    migration._parity_shared_entity_provenance
 * Invariants: NON-GATING (advisory; the operator decision it informs is "did someone also run the dbt migration", which is not a reason to fail a cutover already in flight); conditional-DDL guarded per entity so partial harnesses apply it as a no-op; idempotent via CREATE OR REPLACE; counts only, never row detail.
 * Refs:       migration/phases/parity.py "Shared-entity provenance" CheckResult; sql/99_parity/65_deliverable_action_provenance.sql; sql/99_parity/66_tag_provenance.sql; docs/developer/explanation-dbt-alignment-updates.adoc
 *
 * Parity check: shared-entity provenance sweep (advisory).
 *
 * The dbt migration in data/migration/stage_pmda_for_migration writes sixteen
 * demos_app entities, not one. 65_deliverable_action_provenance.sql gates on
 * deliverable_action because that is where a double-load is both silent and
 * unrecoverable, and 66_tag_provenance.sql gates on the placeholder tag because
 * that key collides outright. Everything else was invisible.
 *
 * This view closes that blind spot in the cheapest useful way: one row per
 * shared entity, with the count of demos_app rows whose id is absent from the
 * corresponding migration._id_map_*. On a single-pipeline run every count is
 * zero. A non-zero count means rows arrived from somewhere else.
 *
 * WHY ADVISORY AND NOT GATING
 *
 * By the time parity runs the load has already happened, so a RED here would
 * fail a cutover over a condition the operator cannot fix in place -- the
 * remedy is a restore and a re-run, which is a rollback decision, not a gate
 * decision. The two genuinely unrecoverable cases already gate. This one exists
 * so the operator LEARNS, in the parity report, that a second writer touched
 * the database.
 *
 * WHY PREFLIGHT DOES NOT COVER IT
 *
 * Preflight P0.6 requires demos_app to be empty, so "dbt ran first" is already
 * caught there (P0.10 now names dbt explicitly so the failure reads clearly).
 * The case preflight structurally cannot catch is "dbt runs AFTER us", because
 * preflight has already passed. That is the case this view is for, and it is
 * why the sweep lives in parity rather than preflight.
 *
 * ENTITY COVERAGE
 *
 * Only entities with an id map are checked; that is what makes "not minted by
 * us" decidable. demonstration is compared against the union of the approved
 * and pending maps because both mint demonstration rows. application covers
 * demonstrations plus amendments, so it unions three maps. The remaining dbt
 * targets -- person_state, system_role_assignment, demonstration_role_assignment,
 * primary_demonstration_role_assignment, application_phase, application_date,
 * tag, tag_name, demonstration_type_tag_assignment,
 * deliverable_demonstration_type -- have no minted uuid of their own (they are
 * keyed by composite natural keys or by text), so they cannot be swept this way;
 * the numbered provenance checks 7, 9, 10 and 12 and the tag check 66 cover the
 * ones that matter.
 *
 * Consumed by migration/phases/parity.py. Reported, never gated.
 *
 * Conditional DDL: each entity contributes only when its table and id map both
 * exist, so a partial harness applies this file as a clean no-op.
 */
SET search_path TO migration, demos_app, public;

DO $$
DECLARE
  parts text[] := ARRAY[]::text[];
BEGIN
  IF to_regclass('demos_app.person') IS NOT NULL AND to_regclass('migration._id_map_users') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'person'::text AS entity,
      count(*)::bigint AS foreign_rows
    FROM
      demos_app.person e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_users m
        WHERE
          m.new_uuid = e.id) $x$;
  END IF;
  IF to_regclass('demos_app.users') IS NOT NULL AND to_regclass('migration._id_map_users') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'users'::text,
      count(*)::bigint
    FROM
      demos_app.users e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_users m
        WHERE
          m.new_uuid = e.id) $x$;
  END IF;
  IF to_regclass('demos_app.demonstration') IS NOT NULL AND to_regclass('migration._id_map_mdcd_demo') IS NOT NULL AND to_regclass('migration._id_map_mdcd_pendg_demo') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'demonstration'::text,
      count(*)::bigint
    FROM
      demos_app.demonstration e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_demo m
        WHERE
          m.new_uuid = e.id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_pendg_demo p
        WHERE
          p.new_uuid = e.id) $x$;
  END IF;
  IF to_regclass('demos_app.application') IS NOT NULL AND to_regclass('migration._id_map_mdcd_demo') IS NOT NULL AND to_regclass('migration._id_map_mdcd_pendg_demo') IS NOT NULL AND to_regclass('migration._id_map_mdcd_demo_amndmt') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'application'::text,
      count(*)::bigint
    FROM
      demos_app.application e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_demo m
        WHERE
          m.new_uuid = e.id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_pendg_demo p
        WHERE
          p.new_uuid = e.id)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_demo_amndmt a
        WHERE
          a.new_uuid = e.id) $x$;
  END IF;
  IF to_regclass('demos_app.deliverable') IS NOT NULL AND to_regclass('migration._id_map_mdcd_dlvrbl') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'deliverable'::text,
      count(*)::bigint
    FROM
      demos_app.deliverable e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_mdcd_dlvrbl m
        WHERE
          m.new_uuid = e.id) $x$;
  END IF;
  IF to_regclass('demos_app.deliverable_action') IS NOT NULL AND to_regclass('migration._id_map_deliverable_action') IS NOT NULL THEN
    parts := parts || $x$
    SELECT
      'deliverable_action'::text,
      count(*)::bigint
    FROM
      demos_app.deliverable_action e
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          migration._id_map_deliverable_action m
        WHERE
          m.new_uuid = e.id) $x$;
  END IF;
  IF cardinality(parts) = 0 THEN
    RAISE NOTICE 'parity shared_entity_provenance: no entity has both a table and an id map; view not created';
    RETURN;
  END IF;
  EXECUTE 'CREATE OR REPLACE VIEW migration._parity_shared_entity_provenance AS ' || array_to_string(parts, ' UNION ALL ');
END
$$;

