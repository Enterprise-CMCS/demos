/*
 * Purpose:    Durable per-row log of Approved demonstrations the loader held back for a missing CHECK-required field (sdg_division/effective/expiration).
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division
 * Outputs:    migration._parity_approved_demo_held
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when stg.demonstration_resolved + the crosswalks are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 13); complements 11_demonstration_completeness.sql (which excludes these rows)
 *
 * Parity check 13: Approved demonstrations held back for a missing required
 * field (durable per-row log for SME review).
 *
 * The DEMOS CHECK check_demonstration_non_null_fields_when_approved rejects any
 * Approved demonstration whose sdg_division_id / effective_date / expiration_date
 * is NULL. The loader (sql/20_app/30_demonstration.sql) therefore HOLDS BACK
 * such rows rather than failing the whole build_app transaction. This view is
 * the per-row record of exactly which Approved demos were excluded and why, so
 * the omission is reviewable after the fact instead of being a silent drop.
 *
 * Per the cutover scope decision the parity check that reads this view is
 * NON-GATING (it surfaces the count + per-row rows, does not RED the gate); see
 * migration/phases/parity.py. The complementary completeness check
 * (11_demonstration_completeness.sql) deliberately EXCLUDES these held-back
 * rows so a deliberate, recorded hold-back does not also trip check 8 RED.
 *
 * Conditional DDL: like 11_demonstration_completeness.sql, the view reads
 * stg.demonstration_resolved plus the crosswalk tables, which exist only in the
 * full pipeline (crosswalks + build_stg onward) and never in the app-layers
 * idempotency harness. Each relation is guarded with its own IF so the view is
 * created only when every input is present; the harness applies this file as a
 * clean no-op (the view is simply absent), and re-apply is idempotent via
 * CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity approved_demo_held: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_demo_status') IS NULL THEN
    RAISE NOTICE 'parity approved_demo_held: mysql_raw.crosswalk_demo_status absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_sdg_division') IS NULL THEN
    RAISE NOTICE 'parity approved_demo_held: mysql_raw.crosswalk_sdg_division absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_approved_demo_held AS
    SELECT
      r.new_uuid                AS demonstration_id,
      r.medicaid_id             AS medicaid_id,
      r.state_id                AS state_id,
      r.status_cd               AS status_cd,
      r.sdg_division_cd         AS sdg_division_cd,
      r.effective_date          AS effective_date,
      r.expiration_date         AS expiration_date,
      concat_ws('; ',
        CASE WHEN xdiv.demos_text_id IS NULL THEN 'missing sdg_division' END,
        CASE WHEN r.effective_date  IS NULL  THEN 'missing effective_date' END,
        CASE WHEN r.expiration_date IS NULL  THEN 'missing expiration_date' END
      )                         AS reason
    FROM stg.demonstration_resolved r
    JOIN mysql_raw.crosswalk_demo_status cw         ON cw.legacy_int_cd = r.status_cd
    LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
    WHERE cw.demos_text_id = 'Approved'
      AND (xdiv.demos_text_id IS NULL OR r.effective_date IS NULL OR r.expiration_date IS NULL);
  $v$;
END
$$;

