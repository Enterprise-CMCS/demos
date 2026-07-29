/*
 * Purpose:    Fold the free-text mdcd_pendg_othr_pgm_dtl program-detail table into demos_app.demonstration_type_tag_assignment, assigning ONLY rows whose free-text name exactly equals a seeded demonstration-type tag, resolving the parent demonstration fold-aware via stg._pendg_demo_fold.
 * Inputs:     mysql_raw.mdcd_pendg_othr_pgm_dtl; stg._pendg_demo_fold; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration.
 * Outputs:    demos_app.demonstration_type_tag_assignment (exact-match rows only).
 * Invariants: runs inside the deferred-constraint build_app txn; guarded inert unless demos_app.demonstration has rows, demos_app.tag is seeded, stg._pendg_demo_fold exists, and the source table is present (each a separate IF so an absent relation is never planned); a free-text name is assigned ONLY when it exactly equals a seeded demonstration-type tag_name_id -- a 1115 demonstration name is never turned into a tag (SME 2026-07-09); non-matching rows are held and surfaced by sql/99_parity/55_pendg_pgm_dtl_tag_othr_held.sql; fold-aware parent (a folded pending demo's tags attach to its approved counterpart, a held-back/no-project pending demo's tags cascade out via the INNER join to demos_app.demonstration); NOT NULL + positive period filter mirrors 11_*.sql; idempotent via ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 * Refs:       sql/21_app_associative/11_demonstration_type_tag_othr.sql; sql/21_app_associative/12_pending_demonstration_type_tag_assignment.sql; sql/10_stg/23_pendg_demo_fold.sql; sql/99_parity/55_pendg_pgm_dtl_tag_othr_held.sql.
 *
 * App load (associative): the free-text "Other" pgm_dtl table, pending track.
 *
 * The pending-track counterpart of 21_app_associative/11. mdcd_pendg_othr_pgm_dtl
 * is the pending analog of mdcd_othr_pgm_dtl: its mdcd_othr_pgm_dtl_name column
 * (same column name as the approved table) carries a per-row free-text program
 * name. Per the SME decision (2026-07-09) a demonstration name must never become
 * a demonstration-type tag, so this loader assigns a row ONLY when its trimmed
 * name exactly equals an already-seeded demonstration-type tag. Every other
 * active row is deliberately held -- not loaded, not turned into a tag -- and
 * logged per-row for SME/SDG review by
 * sql/99_parity/55_pendg_pgm_dtl_tag_othr_held.sql.
 *
 * This is why mdcd_pendg_othr_pgm_dtl carries a BLANK tag_name in
 * reports/pgm_dtl_tag_mapping_pending.csv: the fixed-tag fold loader (12_*.sql)
 * skips blank rows, and this per-row loader handles it instead.
 *
 * Fold-aware parent resolution: the pending program-detail tables key on
 * mdcd_pendg_demo_id, so this loader resolves the parent demonstration through
 * stg._pendg_demo_fold ("approved wins", exactly like 12_*.sql): a folded pending
 * demo's tags attach to its APPROVED counterpart, an orphan pending demo's tags
 * attach to its own 'Under Review' demonstration, and a held-back / no-project
 * pending demo (whose demo_uuid maps to a demonstration that never loaded, or is
 * NULL) is dropped by the INNER join to demos_app.demonstration.
 *
 * GUARDED / inert until its prerequisites exist, like the fixed-tag fold loader.
 * NOT NULL effective/expiration dates and a positive window (from_dt < to_dt,
 * per the DEMOS CHECK effective_date < expiration_date) filter out NULL-period
 * and zero-length/inverted rows, exactly as 11_*.sql does. Idempotent via
 * ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 */
SET search_path TO demos_app, mysql_raw, stg, migration, public;

DO $$
DECLARE
  ins bigint;
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'skip pending othr tag-assignment: demos_app.demonstration absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip pending othr tag-assignment: demos_app.demonstration not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip pending othr tag-assignment: demos_app.tag absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.tag) THEN
  RAISE NOTICE 'skip pending othr tag-assignment: demos_app.tag vocabulary not seeded yet';
  RETURN;
END IF;
  IF to_regclass('stg._pendg_demo_fold') IS NULL THEN
    RAISE NOTICE 'skip pending othr tag-assignment: stg._pendg_demo_fold absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.mdcd_pendg_othr_pgm_dtl') IS NULL THEN
    RAISE NOTICE 'skip pending othr tag-assignment: mysql_raw.mdcd_pendg_othr_pgm_dtl absent';
    RETURN;
  END IF;
  INSERT INTO demos_app.demonstration_type_tag_assignment(demonstration_id, tag_name_id, tag_type_id, effective_date, expiration_date, created_at, updated_at)
  SELECT
    pf.demo_uuid,
    tg.tag_name_id,
    tg.tag_type_id,
    s.from_dt::timestamptz,
    s.to_dt::timestamptz,
    COALESCE(s.creatd_dt::timestamptz, now()),
    COALESCE(s.creatd_dt::timestamptz, now())
  FROM
    mysql_raw.mdcd_pendg_othr_pgm_dtl s
    JOIN stg._pendg_demo_fold pf ON pf.legacy_pendg_demo_id = s.mdcd_pendg_demo_id
    JOIN demos_app.demonstration dem ON dem.id = pf.demo_uuid
    JOIN demos_app.tag tg ON tg.tag_name_id = btrim(s.mdcd_othr_pgm_dtl_name)
    JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
  WHERE
    COALESCE(s.dltd_ind, 0) = 0
    AND s.from_dt IS NOT NULL
    AND s.to_dt IS NOT NULL
    AND s.from_dt < s.to_dt
  ON CONFLICT (demonstration_id,
    tag_name_id)
    DO NOTHING;
  GET DIAGNOSTICS ins = ROW_COUNT;
  RAISE NOTICE 'pending othr tag-assignment: % exact-name-match row(s) inserted; non-matches held (see 55_pendg_pgm_dtl_tag_othr_held.sql)', ins;
END
$$;
