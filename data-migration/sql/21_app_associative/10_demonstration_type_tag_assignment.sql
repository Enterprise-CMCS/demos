/*
 * Purpose:    Fold PMDA mdcd_*_pgm_dtl tables into demos_app.demonstration_type_tag_assignment rows keyed by (demonstration_id, tag_name_id).
 * Inputs:     mysql_raw.crosswalk_pgm_dtl_tag; the mapped mysql_raw.*_pgm_dtl source tables; migration._id_map_mdcd_demo; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration.
 * Outputs:    demos_app.demonstration_type_tag_assignment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; guarded inert unless demos_app.demonstration has rows AND demos_app.tag is seeded, with per-source/per-tag guards skipping absent tables and non-seeded tags; each existence check is a separate IF so an absent relation is never planned; the INSERT joins demos_app.demonstration so a tag whose parent demo was excluded (soft-deleted/filtered) never orphans the FK; NOT NULL effective/expiration dates AND a positive window (from_dt < to_dt, per the DEMOS CHECK effective_date < expiration_date) so NULL-period and zero-length/inverted source rows are filtered and reported; idempotent via ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 * Refs:       reports/pgm_dtl_tag_mapping.csv, docs/sme/reference-pgm-dtl-tag-mapping.adoc
 *
 * App load (associative): demos_app.demonstration_type_tag_assignment.
 *
 * The "tag-pivot fold": PMDA's mdcd_*_pgm_dtl tables collapse into rows of one
 * DEMOS associative table keyed by (demonstration_id, tag_name_id). Each source
 * table maps to a fixed tag_name via reports/pgm_dtl_tag_mapping.csv, loaded
 * into mysql_raw.crosswalk_pgm_dtl_tag by the crosswalks phase (the CSV is the
 * single source; no inline VALUES copy to drift). One source row -> one
 * assignment row: mdcd_demo_id -> demonstration_id
 * (migration._id_map_mdcd_demo), from_dt -> effective_date, to_dt ->
 * expiration_date. The id map carries every legacy demo (including the
 * soft-deleted/excluded ones that never load), so the INSERT joins
 * demos_app.demonstration to keep only assignments whose parent demonstration
 * actually migrated -- a tag on an unloaded demo would orphan the FK.
 * Per-row from_dt_col/to_dt_col in the crosswalk override the
 * default 'from_dt'/'to_dt' column names for non-standard source tables (e.g.
 * mdcd_emer_wvr_authrty_pgm_dtl uses mdcd_emer_wvr_authrty_from_dt/_to_dt).
 *
 * tag_name_id and tag_type_id are resolved together from the seeded
 * demos_app.tag table, restricted to the demonstration-type tag types
 * (demos_app.demonstration_type_tag_type_limit). Nothing is hardcoded: the tag
 * vocabulary is owned and seeded by the DEMOS app, not by the migration.
 *
 * GUARDED / inert until its prerequisites exist, like the person/users loaders.
 * The whole load skips with a NOTICE unless BOTH:
 *   1. demos_app.demonstration has rows (the FK parent is loaded), and
 *   2. demos_app.tag has rows (the tag vocabulary is seeded).
 * Per-source-table guards then skip, with a NOTICE, any mapping entry whose:
 *   - source table is absent from mysql_raw; or
 *   - tag_name is not a seeded demonstration-type tag. The tag_name values are
 *     the human-readable demos_app.tag_name.id strings (e.g. 'Managed Care'),
 *     resolved verbatim -- they are not snake_case slugs.
 *
 * NOT NULL effective_date/expiration_date vs nullable source from_dt/to_dt:
 * rows missing either date are filtered out and reported in a NOTICE; the SME
 * decides a default/backfill before they can load. The same filter drops
 * non-positive windows (from_dt >= to_dt): DEMOS enforces CHECK (effective_date
 * < expiration_date), so a zero-length or inverted period cannot be represented
 * and is reported alongside the NULL-period rows for SME backfill.
 *
 * Idempotent: ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 * See docs/sme/reference-pgm-dtl-tag-mapping.adoc and the source/target map.
 */
SET search_path TO demos_app, mysql_raw, migration, public;

DO $$
DECLARE
  m record;
  v_from text;
  v_to text;
  ins bigint;
  skipped bigint;
  loaded_ct bigint := 0;
  skipped_ct bigint := 0;
BEGIN
  -- Prerequisite guards: stay inert until the parent + vocabulary exist.
  -- Each existence check is a separate IF so the table reference is never
  -- planned when the relation is absent (a combined OR would fail to plan).
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'skip tag-assignment load: demos_app.demonstration absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip tag-assignment load: demos_app.demonstration not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip tag-assignment load: demos_app.tag absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.tag) THEN
  RAISE NOTICE 'skip tag-assignment load: demos_app.tag vocabulary not seeded yet';
  RETURN;
END IF;
  IF to_regclass('migration._id_map_mdcd_demo') IS NULL THEN
    RAISE NOTICE 'skip tag-assignment load: migration._id_map_mdcd_demo absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_pgm_dtl_tag') IS NULL THEN
    RAISE NOTICE 'skip tag-assignment load: mysql_raw.crosswalk_pgm_dtl_tag absent (run crosswalks phase)';
    RETURN;
  END IF;
  -- Per-source-table fold, driven by mysql_raw.crosswalk_pgm_dtl_tag (loaded
  -- from reports/pgm_dtl_tag_mapping.csv by the crosswalks phase). Entries
  -- with a blank tag_name are SME-pending and intentionally omitted.
  FOR m IN
  SELECT
    source_table,
    tag_name,
    from_dt_col,
    to_dt_col
  FROM
    mysql_raw.crosswalk_pgm_dtl_tag
  WHERE
    COALESCE(tag_name, '') <> '' LOOP
        v_from := COALESCE(NULLIF(m.from_dt_col, ''), 'from_dt');
        v_to := COALESCE(NULLIF(m.to_dt_col, ''), 'to_dt');
        IF to_regclass('mysql_raw.' || m.source_table) IS NULL THEN
          RAISE NOTICE 'tag-assignment: source table mysql_raw.% absent -- skipped', m.source_table;
          CONTINUE;
        END IF;
        -- tag_name must resolve to a seeded demonstration-type tag.
        IF NOT EXISTS (
          SELECT
            1
          FROM
            demos_app.tag tg
            JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
          WHERE
            tg.tag_name_id = m.tag_name) THEN
        RAISE NOTICE 'tag-assignment: tag_name % not a seeded demonstration-type tag -- skipped', m.tag_name;
        CONTINUE;
      END IF;
  -- Count source rows dropped for an unloadable period: NULL date (NOT NULL
  -- target dates) or a non-positive window (from_dt >= to_dt). DEMOS enforces
  -- CHECK (effective_date < expiration_date), so a zero-length or inverted
  -- window cannot be represented; it is filtered and reported here, mirroring
  -- the NULL-period rule, for the SME to backfill a valid range.
  EXECUTE format('SELECT count(*) FROM mysql_raw.%1$I s
        WHERE COALESCE(s.dltd_ind, 0) = 0
          AND (s.%2$I IS NULL OR s.%3$I IS NULL
            OR s.%2$I >= s.%3$I)', m.source_table, v_from, v_to) INTO skipped;
  skipped_ct := skipped_ct + skipped;
  EXECUTE format('INSERT INTO demos_app.demonstration_type_tag_assignment(demonstration_id, tag_name_id, tag_type_id, effective_date, expiration_date, created_at, updated_at)
    SELECT
      idm.new_uuid, tg.tag_name_id, tg.tag_type_id, s.%1$I::timestamptz, s.%2$I::timestamptz, COALESCE(s.creatd_dt::timestamptz, now()), COALESCE(s.creatd_dt::timestamptz, now())
  FROM mysql_raw.%3$I s
  JOIN migration._id_map_mdcd_demo idm ON idm.legacy_int_id = s.mdcd_demo_id
  JOIN demos_app.demonstration dem ON dem.id = idm.new_uuid
  JOIN demos_app.tag tg ON tg.tag_name_id = %4$L
  JOIN demos_app.demonstration_type_tag_type_limit lim ON lim.id = tg.tag_type_id
  WHERE
    COALESCE(s.dltd_ind, 0) = 0
    AND s.%1$I IS NOT NULL
    AND s.%2$I IS NOT NULL
    AND s.%1$I < s.%2$I ON CONFLICT (demonstration_id, tag_name_id)
    DO NOTHING', v_from, v_to, m.source_table, m.tag_name);
  GET DIAGNOSTICS ins = ROW_COUNT;
  loaded_ct := loaded_ct + ins;
END LOOP;
  RAISE NOTICE 'tag-assignment load: % row(s) inserted, % source row(s) skipped for NULL or non-positive period', loaded_ct, skipped_ct;
END
$$;

