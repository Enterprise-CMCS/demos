/*
 * Purpose:    Durable per-row log of deliverables whose type-based budget-neutrality (BN) classification disagrees with the legacy BN signals (bdgt_ntrlty_ind / name), for SME review.
 * Inputs:     stg.deliverable_resolved; mysql_raw.crosswalk_deliverable_type (LEFT JOIN, optional)
 * Outputs:    migration._parity_deliverable_bn_qa
 * Invariants: NON-GATING (surfaces the count + per-row rows, does not RED the gate); conditional-DDL guard (created only when stg.deliverable_resolved is present, so the app-layers idempotency harness applies it as a no-op); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "deliverable BN QA" check); sql/04_crosswalks/52_deliverable_type.sql; reports/crosswalks/proposed/deliverable_type_bn_routing.md
 *
 * BN routing QA (non-gating): deliverable_type is now routed purely by the
 * report-occurrence code mdcd_dlvrbl_type_cd (57 = Quarterly BN, 70 = Annual
 * BN). The legacy per-deliverable bdgt_ntrlty_ind flag and the free-text name
 * were RETIRED as routing inputs (they are largely redundant: bdgt_ntrlty_ind
 * is set only on types 57/70). This view keeps them as a QA signal: it flags
 * every migratable deliverable where the type-based BN classification disagrees
 * with the flag or the name, so an SME can review whether the source flag/name
 * (not the type) was the mislabeled one. It never gates -- the type is
 * authoritative -- it only logs.
 *
 * Flagged disagreements (per row, concatenated into `reason`):
 *   - type is BN (57/70) but bdgt_ntrlty_ind = 0
 *   - type is NOT BN but bdgt_ntrlty_ind = 1
 *   - type is NOT BN but the name mentions "budget neutrality"
 *
 * Conditional DDL: the view reads stg.deliverable_resolved, which exists only
 * in the full pipeline and never in the app-layers idempotency harness; guarded
 * so the harness applies this file as a clean no-op, and re-apply is idempotent
 * via CREATE OR REPLACE.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.deliverable_resolved') IS NULL THEN
    RAISE NOTICE 'parity deliverable_bn_qa: stg.deliverable_resolved absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_deliverable_bn_qa AS
    WITH flagged AS (
      SELECT
        r.new_uuid            AS deliverable_id,
        r.legacy_id           AS legacy_id,
        r.deliverable_type_cd AS deliverable_type_cd,
        xtype.demos_text_id   AS demos_deliverable_type,
        r.budget_neutrality_ind AS bdgt_ntrlty_ind,
        r.name                AS name,
        (r.deliverable_type_cd IN (57, 70))     AS type_is_bn,
        (r.budget_neutrality_ind = 1)           AS flag_is_bn,
        (r.name ILIKE '%budget neutrality%')    AS name_is_bn
      FROM stg.deliverable_resolved r
      LEFT JOIN mysql_raw.crosswalk_deliverable_type xtype
        ON xtype.legacy_int_cd = r.deliverable_type_cd
    )
    SELECT
      deliverable_id,
      legacy_id,
      deliverable_type_cd,
      demos_deliverable_type,
      bdgt_ntrlty_ind,
      name,
      concat_ws('; ',
        CASE WHEN type_is_bn AND NOT flag_is_bn
             THEN 'BN type (57/70) but bdgt_ntrlty_ind=0' END,
        CASE WHEN NOT type_is_bn AND flag_is_bn
             THEN 'non-BN type but bdgt_ntrlty_ind=1' END,
        CASE WHEN NOT type_is_bn AND name_is_bn
             THEN 'name mentions budget neutrality but type is not BN' END
      ) AS reason
    FROM flagged
    WHERE (type_is_bn <> flag_is_bn)
       OR (NOT type_is_bn AND name_is_bn);
  $v$;
END
$$;

