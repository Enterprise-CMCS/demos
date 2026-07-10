/*
 * Purpose:    Durable per-row log of free-text mdcd_othr_pgm_dtl rows held back from the demonstration-type tag fold, plus a fail-closed guard for any pgm_dtl tag_name that is not a seeded demonstration-type tag.
 * Inputs:     mysql_raw.mdcd_othr_pgm_dtl; mysql_raw.crosswalk_pgm_dtl_tag; migration._id_map_mdcd_demo; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration, demos_app.demonstration_type_tag_assignment.
 * Outputs:    migration._parity_pgm_dtl_tag_othr_held; migration._parity_pgm_dtl_tag_unseeded.
 * Invariants: othr-held is NON-GATING (surfaces the count + per-row rows for SME review); unseeded is GATING (fail-closed: any non-blank pgm_dtl tag_name that does not resolve to a seeded demonstration-type tag is a silent-skip risk in 10_*.sql); conditional-DDL guarded so each view is created only when its inputs exist (the app-layers idempotency harness applies both as no-ops); idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py; sql/21_app_associative/10_demonstration_type_tag_assignment.sql; sql/21_app_associative/11_demonstration_type_tag_othr.sql; reports/crosswalks/proposed/pgm_dtl_tag_sme_decisions.md.
 *
 * Parity: pgm_dtl demonstration-type tag coverage.
 *
 * Two views, two purposes:
 *
 *   migration._parity_pgm_dtl_tag_othr_held (NON-GATING) -- one row per active
 *     mdcd_othr_pgm_dtl source row that did NOT produce a
 *     demonstration_type_tag_assignment, with the reason. The dominant reason is
 *     the SME rule: a free-text name that is not an exact seeded
 *     demonstration-type tag is held (never turned into a tag, because it is a
 *     1115 demonstration name, not a category). The remaining reasons mirror the
 *     fold loaders (parent demonstration not migrated, NULL or non-positive
 *     period). Reported, not gated: the count + rows are logged for SME review.
 *
 *   migration._parity_pgm_dtl_tag_unseeded (GATING) -- one row per
 *     crosswalk_pgm_dtl_tag mapping whose tag_name is non-blank but does not
 *     resolve to a seeded demonstration-type tag. The fixed-tag fold loader
 *     (10_*.sql) silently skips such a mapping (fail-open NOTICE), so this guard
 *     makes that silent-skip visible and fails the gate closed. Expected empty:
 *     the seven SME-approved tags absent from the DEMOS seed are created as
 *     User/Unapproved tags in sql/21_app_associative/05.
 *
 * Conditional DDL: the inputs exist only in the full pipeline, so each view is
 * guarded and the app-layers idempotency harness applies this file as a clean
 * no-op; re-apply is idempotent via CREATE OR REPLACE.
 */
SET search_path TO migration, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('mysql_raw.mdcd_othr_pgm_dtl') IS NULL OR to_regclass('migration._id_map_mdcd_demo') IS NULL OR to_regclass('demos_app.demonstration_type_tag_assignment') IS NULL OR to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'parity pgm_dtl othr_held: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_pgm_dtl_tag_othr_held AS
      SELECT
        s.mdcd_othr_pgm_dtl_id           AS legacy_id,
        s.mdcd_demo_id                   AS legacy_demo_id,
        idm.new_uuid                     AS demonstration_id,
        btrim(s.mdcd_othr_pgm_dtl_name)  AS othr_name,
        concat_ws('; ',
          CASE WHEN tg.tag_name_id IS NULL
               THEN 'free-text name is not a seeded demonstration-type tag (1115 name held per SME)' END,
          CASE WHEN idm.new_uuid IS NULL OR dem.id IS NULL
               THEN 'parent demonstration not migrated' END,
          CASE WHEN s.from_dt IS NULL OR s.to_dt IS NULL
               THEN 'NULL effective/expiration period' END,
          CASE WHEN s.from_dt IS NOT NULL AND s.to_dt IS NOT NULL AND s.from_dt >= s.to_dt
               THEN 'non-positive period' END
        )                                AS reason
      FROM mysql_raw.mdcd_othr_pgm_dtl s
      LEFT JOIN migration._id_map_mdcd_demo idm ON idm.legacy_int_id = s.mdcd_demo_id
      LEFT JOIN demos_app.demonstration dem ON dem.id = idm.new_uuid
      LEFT JOIN demos_app.tag tg
        ON tg.tag_name_id = btrim(s.mdcd_othr_pgm_dtl_name)
        AND EXISTS (
          SELECT 1 FROM demos_app.demonstration_type_tag_type_limit lim
           WHERE lim.id = tg.tag_type_id)
      WHERE COALESCE(s.dltd_ind, 0) = 0
        AND NOT EXISTS (
          SELECT 1 FROM demos_app.demonstration_type_tag_assignment a
           WHERE a.demonstration_id = idm.new_uuid
             AND a.tag_name_id = btrim(s.mdcd_othr_pgm_dtl_name));
    $v$;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_pgm_dtl_tag') IS NULL OR to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'parity pgm_dtl unseeded: inputs absent; view not created';
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW migration._parity_pgm_dtl_tag_unseeded AS
      SELECT
        x.source_table,
        x.tag_name
      FROM mysql_raw.crosswalk_pgm_dtl_tag x
      WHERE COALESCE(x.tag_name, '') <> ''
        AND NOT EXISTS (
          SELECT 1 FROM demos_app.tag tg
            JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
           WHERE tg.tag_name_id = x.tag_name);
    $v$;
  END IF;
END
$$;

