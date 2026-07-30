/*
 * Purpose:    Durable per-row log of free-text mdcd_pendg_othr_pgm_dtl rows held back from the pending demonstration-type tag fold, plus a fail-closed guard for any pending pgm_dtl tag_name that is not a seeded demonstration-type tag.
 * Inputs:     mysql_raw.mdcd_pendg_othr_pgm_dtl; mysql_raw.crosswalk_pendg_pgm_dtl_tag; stg._pendg_demo_fold; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration, demos_app.demonstration_type_tag_assignment.
 * Outputs:    migration._parity_pendg_pgm_dtl_tag_othr_held; migration._parity_pendg_pgm_dtl_tag_unseeded.
 * Invariants: pending othr-held is NON-GATING (surfaces the count + per-row rows for SME/SDG review); pending unseeded is GATING (fail-closed: any non-blank pending pgm_dtl tag_name that does not resolve to a seeded demonstration-type tag is a silent-skip risk in 12_*.sql); conditional-DDL guarded so each view is created only when its inputs exist (the app-layers idempotency harness applies both as no-ops); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py; sql/21_app_associative/12_pending_demonstration_type_tag_assignment.sql; sql/21_app_associative/13_pending_demonstration_type_tag_othr.sql; sql/99_parity/54_pgm_dtl_tag_othr_held.sql; sql/10_stg/23_pendg_demo_fold.sql.
 *
 * Parity: pending pgm_dtl demonstration-type tag coverage.
 *
 * The pending-track counterpart of 99_parity/54. Two views, two purposes:
 *
 *   migration._parity_pendg_pgm_dtl_tag_othr_held (NON-GATING) -- one row per
 *     active mdcd_pendg_othr_pgm_dtl source row that did NOT produce a
 *     demonstration_type_tag_assignment, with the reason. The dominant reason is
 *     the SME rule: a free-text name that is not an exact seeded
 *     demonstration-type tag is held (never turned into a tag, because it is a
 *     1115 demonstration name, not a category). The remaining reasons mirror the
 *     fold loaders (parent demonstration not migrated -- held-back / no-project
 *     pending demo -- NULL or non-positive period). Reported, not gated: the
 *     count + rows are logged for SME/SDG review. Parent resolution is fold-aware
 *     via stg._pendg_demo_fold (a folded pending demo resolves to its approved
 *     counterpart UUID).
 *
 *   migration._parity_pendg_pgm_dtl_tag_unseeded (GATING) -- one row per
 *     crosswalk_pendg_pgm_dtl_tag mapping whose tag_name is non-blank but does
 *     not resolve to a seeded demonstration-type tag. The fixed-tag fold loader
 *     (12_*.sql) silently skips such a mapping (fail-open NOTICE), so this guard
 *     makes that silent-skip visible and fails the gate closed. Expected empty:
 *     the pending mapping is derived from reports/pgm_dtl_tag_mapping.csv, whose
 *     tag_names are all seeded (the seven User/Unapproved tags are created in
 *     sql/21_app_associative/05).
 *
 * Conditional DDL: the inputs exist only in the full pipeline, so each view is
 * guarded and the app-layers idempotency harness applies this file as a clean
 * no-op; re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, mysql_raw, stg, demos_app, public;

DO $$
BEGIN
  IF to_regclass('mysql_raw.mdcd_pendg_othr_pgm_dtl') IS NULL OR to_regclass('stg._pendg_demo_fold') IS NULL OR to_regclass('demos_app.demonstration_type_tag_assignment') IS NULL OR to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'parity pending pgm_dtl othr_held: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_pendg_pgm_dtl_tag_othr_held AS
      SELECT
        s.mdcd_pendg_othr_pgm_dtl_id     AS legacy_id,
        s.mdcd_pendg_demo_id             AS legacy_pendg_demo_id,
        pf.demo_uuid                     AS demonstration_id,
        btrim(s.mdcd_othr_pgm_dtl_name)  AS othr_name,
        concat_ws('; ',
          CASE WHEN tg.tag_name_id IS NULL
               THEN 'free-text name is not a seeded demonstration-type tag (1115 name held per SME)' END,
          CASE WHEN pf.demo_uuid IS NULL OR dem.id IS NULL
               THEN 'parent demonstration not migrated (held-back / no-project pending demo)' END,
          CASE WHEN s.from_dt IS NULL OR s.to_dt IS NULL
               THEN 'NULL effective/expiration period' END,
          CASE WHEN s.from_dt IS NOT NULL AND s.to_dt IS NOT NULL AND s.from_dt >= s.to_dt
               THEN 'non-positive period' END
        )                                AS reason
      FROM mysql_raw.mdcd_pendg_othr_pgm_dtl s
      LEFT JOIN stg._pendg_demo_fold pf ON pf.legacy_pendg_demo_id = s.mdcd_pendg_demo_id
      LEFT JOIN demos_app.demonstration dem ON dem.id = pf.demo_uuid
      LEFT JOIN demos_app.tag tg
        ON tg.tag_name_id = btrim(s.mdcd_othr_pgm_dtl_name)
        AND EXISTS (
          SELECT 1 FROM demos_app.demonstration_type_tag_type_limit lim
           WHERE lim.id = tg.tag_type_id)
      WHERE COALESCE(s.dltd_ind, 0) = 0
        AND NOT EXISTS (
          SELECT 1 FROM demos_app.demonstration_type_tag_assignment a
           WHERE a.demonstration_id = pf.demo_uuid
             AND a.tag_name_id = btrim(s.mdcd_othr_pgm_dtl_name));
    $v$;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_pendg_pgm_dtl_tag') IS NULL OR to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'parity pending pgm_dtl unseeded: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_pendg_pgm_dtl_tag_unseeded AS
      SELECT
        x.source_table,
        x.tag_name
      FROM mysql_raw.crosswalk_pendg_pgm_dtl_tag x
      WHERE COALESCE(x.tag_name, '') <> ''
        AND NOT EXISTS (
          SELECT 1 FROM demos_app.tag tg
            JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
           WHERE tg.tag_name_id = x.tag_name);
    $v$;
  END IF;
END
$$;

