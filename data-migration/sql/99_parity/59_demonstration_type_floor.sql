/*
 * Purpose:    Durable per-row log of demonstrations floored with the "Migrated From PMDA" placeholder demonstration type (provenance for the zero-type floor decision).
 * Inputs:     demos_app.demonstration; demos_app.demonstration_type_tag_assignment
 * Outputs:    migration._parity_demonstration_type_floor
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when both demos_app tables exist, so partial harnesses that never run the floor loader apply it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       sql/21_app_associative/14_demonstration_type_tag_floor.sql; migration/phases/parity.py (non-gating check 24)
 *
 * Parity check 24: demonstrations floored with the "Migrated From PMDA"
 * placeholder demonstration type.
 *
 * The floor loader (sql/21_app_associative/14_demonstration_type_tag_floor.sql)
 * assigns a single "Migrated From PMDA" placeholder demonstration-type tag to
 * every Approved demonstration that migrated with zero demonstration types, so
 * a settled record is never left type-less. The placeholder tag is unique to
 * that loader, so a demonstration_type_tag_assignment carrying it is exactly a
 * floored demonstration. This view is the reviewable per-row record so the SME
 * can see which Approved demonstrations carry the placeholder pending in-app
 * assignment of the real type(s). Per the cutover scope decision the parity
 * check that reads it is NON-GATING.
 *
 * Conditional DDL: guarded on both demos_app tables so a partial harness (which
 * never runs the floor loader) applies this file as a clean no-op. Re-apply is
 * idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, demos_app, public;

DO $$
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'parity demonstration_type_floor: demos_app.demonstration absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('demos_app.demonstration_type_tag_assignment') IS NULL THEN
    RAISE NOTICE 'parity demonstration_type_floor: demos_app.demonstration_type_tag_assignment absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_type_floor AS
    SELECT
      d.id          AS demonstration_id,
      d.medicaid_id AS medicaid_id,
      d.state_id    AS state_id,
      d.status_id   AS status_id
    FROM demos_app.demonstration d
    JOIN demos_app.demonstration_type_tag_assignment a
      ON a.demonstration_id = d.id
     AND a.tag_name_id = 'Migrated From PMDA';
  $v$;
END
$$;

