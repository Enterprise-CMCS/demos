/*
 * Purpose:    Link every loaded deliverable to the demonstration types its parent demonstration actually carries, so the DEMOS deliverable views and the deliverable-status report can filter by demonstration type.
 * Inputs:     demos_app.deliverable; demos_app.demonstration_type_tag_assignment
 * Outputs:    demos_app.deliverable_demonstration_type
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert until both inputs exist; placed at 15_ so it runs AFTER the demonstration-type loaders (10-14) and therefore sees the real types plus any D16 floor; derives the tag set by joining demonstration_type_tag_assignment, so the composite FK (demonstration_id, demonstration_type_tag_name_id) is satisfied by construction; idempotent via ON CONFLICT DO NOTHING.
 * Refs:       sql/20_app/40_deliverable.sql, sql/21_app_associative/10_demonstration_type_tag_assignment.sql, sql/21_app_associative/14_demonstration_type_tag_floor.sql, docs/developer/explanation-dbt-alignment-updates.adoc
 *
 * App load (associative): demos_app.deliverable_demonstration_type.
 *
 * DEMOS records which demonstration types a deliverable pertains to. The table
 * is keyed (deliverable_id, demonstration_id, demonstration_type_tag_name_id)
 * and carries two composite FKs -- one to deliverable(id, demonstration_id) and
 * one to demonstration_type_tag_assignment(demonstration_id, tag_name_id) -- so
 * a tag can only be attached to a deliverable if the parent demonstration
 * already carries that tag. Deriving the rows FROM
 * demonstration_type_tag_assignment therefore satisfies both FKs by
 * construction; there is no way to emit an orphan.
 *
 * WHY EVERY TYPE, AND WHY NO DELIVERABLE-TYPE FILTER
 *
 * PMDA has no per-deliverable demonstration-type linkage to migrate.
 * mysql_raw.mdcd_dlvrbl carries mdcd_demo_id and nothing else that narrows a
 * deliverable to a subset of its demonstration's programs, so the only fact the
 * source supports is "this deliverable belongs to this demonstration, which is
 * of these types". Assigning the parent's full type set is therefore a
 * derivation from real data rather than a guess, and it is what the pgm_dtl
 * fold (10-13) already established per demonstration.
 *
 * The dbt migration instead writes a single synthetic 'Migrated From PMDA' tag
 * and only for deliverable_type_id IN ('Implementation Plan', 'Monitoring
 * Protocol'). Neither restriction is adopted here. dbt needs the synthetic tag
 * because it force-assigns that one type to every finalized demonstration and
 * so has no real types to draw on; this pipeline has the real ones. And the
 * two-deliverable-type filter has no counterpart in the DEMOS model --
 * setDeliverableDemonstrationTypes() is generic and createDeliverable() calls
 * it for any deliverable type -- so narrowing to two types would discard
 * loadable links for no stated reason. The divergence is deliberate and
 * recorded in explanation-dbt-alignment-updates.adoc.
 *
 * A deliverable whose demonstration carries no types at all contributes no row.
 * That is correct rather than a gap: after 14_*.sql every Approved
 * demonstration has at least one type, so the uncovered set is the Under Review
 * demos D16 intentionally leaves unfloored.
 *
 * GUARDED / inert until both inputs exist, so the app-layers idempotency
 * harness applies this file as a clean no-op.
 *
 * Idempotent: ON CONFLICT DO NOTHING on the full primary key.
 */
SET search_path TO demos_app, migration, public;

DO $$
DECLARE
  ins bigint;
BEGIN
  IF to_regclass('demos_app.deliverable') IS NULL THEN
    RAISE NOTICE 'skip deliverable-demonstration-type load: demos_app.deliverable absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration_type_tag_assignment') IS NULL THEN
    RAISE NOTICE 'skip deliverable-demonstration-type load: demos_app.demonstration_type_tag_assignment absent';
    RETURN;
  END IF;
  IF to_regclass('demos_app.deliverable_demonstration_type') IS NULL THEN
    RAISE NOTICE 'skip deliverable-demonstration-type load: demos_app.deliverable_demonstration_type absent';
    RETURN;
  END IF;
  INSERT INTO demos_app.deliverable_demonstration_type(deliverable_id, demonstration_id, demonstration_type_tag_name_id)
  SELECT
    d.id,
    d.demonstration_id,
    a.tag_name_id
  FROM
    demos_app.deliverable d
    JOIN demos_app.demonstration_type_tag_assignment a ON a.demonstration_id = d.demonstration_id
  ON CONFLICT (deliverable_id,
    demonstration_id,
    demonstration_type_tag_name_id)
    DO NOTHING;
  GET DIAGNOSTICS ins = ROW_COUNT;
  RAISE NOTICE 'deliverable-demonstration-type load: % row(s) inserted', ins;
END
$$;

