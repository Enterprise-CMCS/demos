/*
 * Purpose:    Fold the free-text mdcd_othr_pgm_dtl program-detail table into demos_app.demonstration_type_tag_assignment, assigning ONLY rows whose free-text name exactly equals a seeded demonstration-type tag.
 * Inputs:     mysql_raw.mdcd_othr_pgm_dtl; migration._id_map_mdcd_demo; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration.
 * Outputs:    demos_app.demonstration_type_tag_assignment (exact-match rows only).
 * Invariants: runs inside the deferred-constraint build_app txn; guarded inert unless demos_app.demonstration has rows, demos_app.tag is seeded, the id map exists, and the source table is present (each a separate IF so an absent relation is never planned); a free-text name is assigned ONLY when it exactly equals a seeded demonstration-type tag_name_id -- a 1115 demonstration name is never turned into a tag (SME 2026-07-09); non-matching rows are held and surfaced by sql/99_parity/54_pgm_dtl_tag_othr_held.sql; NOT NULL + positive period filter mirrors 10_*.sql; idempotent via ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 * Refs:       reports/crosswalks/proposed/pgm_dtl_tag_sme_decisions.md; sql/21_app_associative/10_demonstration_type_tag_assignment.sql; sql/99_parity/54_pgm_dtl_tag_othr_held.sql.
 *
 * App load (associative): the free-text "Other" pgm_dtl table.
 *
 * mdcd_othr_pgm_dtl is the one pgm_dtl source whose tag is NOT a fixed value:
 * its mdcd_othr_pgm_dtl_name column carries a per-row free-text program name
 * (54 distinct active values, mostly one-off 1115 demonstration names such as
 * "Badger Care" or "Oregon Health Plan"). Per the SME decision (2026-07-09) a
 * demonstration name must never become a demonstration-type tag, so this loader
 * assigns a row ONLY when its trimmed name exactly equals an already-seeded
 * demonstration-type tag (e.g. "Behavioral Health", "Pharmacy"). Every other
 * active row is deliberately held -- not loaded, not turned into a tag -- and
 * logged per-row for SME review by sql/99_parity/54_pgm_dtl_tag_othr_held.sql.
 *
 * This is why mdcd_othr_pgm_dtl carries a BLANK tag_name in
 * reports/pgm_dtl_tag_mapping.csv: the fixed-tag fold loader (10_*.sql) skips
 * blank rows, and this per-row loader handles it instead.
 *
 * GUARDED / inert until its prerequisites exist, like the fixed-tag fold loader.
 * NOT NULL effective/expiration dates and a positive window (from_dt < to_dt,
 * per the DEMOS CHECK effective_date < expiration_date) filter out NULL-period
 * and zero-length/inverted rows, exactly as 10_*.sql does. Idempotent via
 * ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 */
SET search_path TO demos_app, mysql_raw, migration, public;

DO $$
DECLARE
  ins bigint;
BEGIN
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'skip othr tag-assignment: demos_app.demonstration absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip othr tag-assignment: demos_app.demonstration not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip othr tag-assignment: demos_app.tag absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.tag) THEN
  RAISE NOTICE 'skip othr tag-assignment: demos_app.tag vocabulary not seeded yet';
  RETURN;
END IF;
  IF to_regclass('migration._id_map_mdcd_demo') IS NULL THEN
    RAISE NOTICE 'skip othr tag-assignment: migration._id_map_mdcd_demo absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.mdcd_othr_pgm_dtl') IS NULL THEN
    RAISE NOTICE 'skip othr tag-assignment: mysql_raw.mdcd_othr_pgm_dtl absent';
    RETURN;
  END IF;
  INSERT INTO demos_app.demonstration_type_tag_assignment(demonstration_id, tag_name_id, tag_type_id, effective_date, expiration_date, created_at, updated_at)
  SELECT
    idm.new_uuid,
    tg.tag_name_id,
    tg.tag_type_id,
    s.from_dt::timestamptz,
    s.to_dt::timestamptz,
    COALESCE(s.creatd_dt::timestamptz, now()),
    COALESCE(s.creatd_dt::timestamptz, now())
  FROM
    mysql_raw.mdcd_othr_pgm_dtl s
    JOIN migration._id_map_mdcd_demo idm ON idm.legacy_int_id = s.mdcd_demo_id
    JOIN demos_app.demonstration dem ON dem.id = idm.new_uuid
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
  RAISE NOTICE 'othr tag-assignment: % exact-name-match row(s) inserted; non-matches held (see 54_pgm_dtl_tag_othr_held.sql)', ins;
END
$$;

