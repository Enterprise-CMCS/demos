/*
 * Purpose:    Durable per-row log of demonstrations the loader held back as the non-winning row of a duplicate medicaid_id (RED-4).
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division; migration.state_region
 * Outputs:    migration._parity_demonstration_held_dup_medicaid_id
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when stg.demonstration_resolved + the crosswalks + state_region are present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating check 21); sql/20_app/30_demonstration.sql (the hold-back); complements 11_demonstration_completeness.sql (which excludes these rows)
 *
 * Parity check 21: demonstrations held back for a duplicate medicaid_id
 * (durable per-row log for SME review).
 *
 * DEMOS enforces demonstration_medicaid_id_key UNIQUE, but the source can carry
 * the same mdcd_demo_num on two live demonstrations (the RED-4 defect: LA #2506
 * and TX #2513 both numbered 11-W-00232/6). The loader
 * (sql/20_app/30_demonstration.sql) therefore loads ONE deterministic winner
 * per medicaid_id and HOLDS BACK the rest rather than failing the whole
 * build_app transaction. Winner rule (SME-ratified): the row whose medicaid_id
 * CMS-region suffix (the /N; region 10 is written as a trailing 0) matches its
 * state's region wins, then the lowest legacy mdcd_demo_id. This view is the
 * per-row record of exactly which demonstrations were held back and which
 * winner kept the number, so the omission is reviewable (and SME-correctable at
 * source) instead of being a silent drop.
 *
 * Per the cutover scope decision the parity check that reads this view is
 * NON-GATING; see migration/phases/parity.py. The completeness check
 * (11_demonstration_completeness.sql) deliberately EXCLUDES these held-back
 * rows so a deliberate, recorded hold-back does not also trip check 8 RED.
 *
 * Conditional DDL: like 12_approved_demo_held_for_division.sql, the view reads
 * stg.demonstration_resolved plus the crosswalk tables and migration.state_region,
 * which exist only in the full pipeline (crosswalks + build_stg onward) and
 * never in the app-layers idempotency harness. Each relation is guarded with its
 * own IF so the view is created only when every input is present; the harness
 * applies this file as a clean no-op (the view is simply absent), and re-apply
 * is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_demo_status') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: mysql_raw.crosswalk_demo_status absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_sdg_division') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: mysql_raw.crosswalk_sdg_division absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration.state_region') IS NULL THEN
    RAISE NOTICE 'parity demonstration_held_dup_medicaid: migration.state_region absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_demonstration_held_dup_medicaid_id AS
    WITH insertable AS (
      SELECT
        r.new_uuid       AS demonstration_id,
        r.legacy_demo_id AS legacy_demo_id,
        r.medicaid_id    AS medicaid_id,
        r.state_id       AS state_id,
        r.status_cd      AS status_cd,
        CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
          AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
            OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
          THEN 0 ELSE 1 END AS region_rank
      FROM stg.demonstration_resolved r
      JOIN mysql_raw.crosswalk_demo_status cw        ON cw.legacy_int_cd = r.status_cd
      JOIN migration.state_region sr                 ON sr.state_id = r.state_id
      LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
      WHERE r.medicaid_id IS NOT NULL
        AND NOT (cw.demos_text_id = 'Approved'
          AND (xdiv.demos_text_id IS NULL OR r.effective_date IS NULL OR r.expiration_date IS NULL))
    ),
    ranked AS (
      SELECT
        i.*,
        ROW_NUMBER() OVER (PARTITION BY i.medicaid_id ORDER BY i.region_rank, i.legacy_demo_id) AS rn,
        first_value(i.legacy_demo_id) OVER (PARTITION BY i.medicaid_id ORDER BY i.region_rank, i.legacy_demo_id) AS kept_legacy_demo_id,
        first_value(i.demonstration_id) OVER (PARTITION BY i.medicaid_id ORDER BY i.region_rank, i.legacy_demo_id) AS kept_demonstration_id
      FROM insertable i
    )
    SELECT
      ranked.demonstration_id,
      ranked.legacy_demo_id,
      ranked.medicaid_id,
      ranked.state_id,
      ranked.status_cd,
      ranked.kept_legacy_demo_id,
      ranked.kept_demonstration_id,
      'duplicate medicaid_id; kept legacy demo ' || ranked.kept_legacy_demo_id
        || CASE WHEN ranked.region_rank = 1 THEN ' (region-suffix mismatch)' ELSE ' (lower legacy id)' END
        AS reason
    FROM ranked
    WHERE ranked.rn > 1;
  $v$;
END
$$;
