/*
 * Purpose:    Fold PMDA mdcd_pendg_*_pgm_dtl tables into demos_app.demonstration_type_tag_assignment rows, resolving the parent demonstration fold-aware via stg._pendg_demo_fold.
 * Inputs:     mysql_raw.crosswalk_pendg_pgm_dtl_tag; the mapped mysql_raw.mdcd_pendg_*_pgm_dtl source tables; stg._pendg_demo_fold; demos_app.tag, demos_app.demonstration_type_tag_type_limit, demos_app.demonstration.
 * Outputs:    demos_app.demonstration_type_tag_assignment
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; ships INERT (crosswalk_pendg_pgm_dtl_tag is empty until the SME adds the pending mapping, so the fold loop iterates nothing); guarded inert unless demos_app.demonstration has rows AND demos_app.tag is seeded AND stg._pendg_demo_fold exists, with per-source/per-tag guards; each existence check is a separate IF so an absent relation is never planned; fold-aware -- the INSERT joins demos_app.demonstration on stg._pendg_demo_fold.demo_uuid so a folded pending demo's tags attach to its approved counterpart and a held-back/no-project pending demo's tags never orphan the FK; NOT NULL effective/expiration dates AND a positive window (from_dt < to_dt); idempotent via ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 * Refs:       reports/pgm_dtl_tag_mapping_pending.csv, sql/21_app_associative/10_demonstration_type_tag_assignment.sql, sql/10_stg/23_pendg_demo_fold.sql
 *
 * App load (associative): demos_app.demonstration_type_tag_assignment, pending track.
 *
 * The pending-track counterpart of 21_app_associative/10. PMDA's
 * mdcd_pendg_*_pgm_dtl tables collapse into the same DEMOS associative table
 * keyed by (demonstration_id, tag_name_id). Each pending source table maps to a
 * fixed tag_name via reports/pgm_dtl_tag_mapping_pending.csv, loaded into
 * mysql_raw.crosswalk_pendg_pgm_dtl_tag by the crosswalks phase (the CSV is the
 * single source; no inline VALUES copy to drift).
 *
 * Fold-aware parent resolution: the pending program-detail tables key on
 * mdcd_pendg_demo_id, so this loader resolves the parent demonstration through
 * stg._pendg_demo_fold ("approved wins"): a folded pending demo's tags attach to
 * its APPROVED counterpart (demo_uuid = approved UUID), an orphan pending demo's
 * tags attach to its own 'Under Review' demonstration (demo_uuid = pending
 * UUID), and a held-back / no-project-number pending demo (whose demo_uuid maps
 * to a demonstration that never loaded, or is NULL) is dropped by the INNER join
 * to demos_app.demonstration -- a tag on an unloaded demo would orphan the FK.
 * Per-row from_dt_col/to_dt_col in the crosswalk override the default
 * 'from_dt'/'to_dt' column names for non-standard source tables.
 *
 * tag_name_id and tag_type_id are resolved together from the seeded
 * demos_app.tag table, restricted to the demonstration-type tag types
 * (demos_app.demonstration_type_tag_type_limit); the tag vocabulary is owned and
 * seeded by the DEMOS app, not by the migration.
 *
 * GUARDED / INERT: reports/pgm_dtl_tag_mapping_pending.csv is header-only until
 * the SME adds the pending mapping, so crosswalk_pendg_pgm_dtl_tag is empty and
 * the fold loop iterates nothing. The whole load also skips with a NOTICE unless
 * demos_app.demonstration has rows, demos_app.tag is seeded, and
 * stg._pendg_demo_fold exists. Per-source-table guards then skip, with a NOTICE,
 * any mapping entry whose source table is absent from mysql_raw or whose
 * tag_name is not a seeded demonstration-type tag.
 *
 * NOT NULL effective_date/expiration_date vs nullable source from_dt/to_dt: rows
 * missing either date, or with a non-positive window (from_dt >= to_dt, which
 * DEMOS forbids via CHECK effective_date < expiration_date), are filtered out
 * and reported in a NOTICE for SME backfill.
 *
 * Idempotent: ON CONFLICT (demonstration_id, tag_name_id) DO NOTHING.
 */
SET search_path TO demos_app, mysql_raw, stg, migration, public;

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
  -- Prerequisite guards: stay inert until the parent + vocabulary + fold exist.
  -- Each existence check is a separate IF so the table reference is never
  -- planned when the relation is absent (a combined OR would fail to plan).
  IF to_regclass('demos_app.demonstration') IS NULL THEN
    RAISE NOTICE 'skip pending tag-assignment load: demos_app.demonstration absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.demonstration) THEN
  RAISE NOTICE 'skip pending tag-assignment load: demos_app.demonstration not loaded yet';
  RETURN;
END IF;
  IF to_regclass('demos_app.tag') IS NULL THEN
    RAISE NOTICE 'skip pending tag-assignment load: demos_app.tag absent';
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT
      1
    FROM
      demos_app.tag) THEN
  RAISE NOTICE 'skip pending tag-assignment load: demos_app.tag vocabulary not seeded yet';
  RETURN;
END IF;
  IF to_regclass('stg._pendg_demo_fold') IS NULL THEN
    RAISE NOTICE 'skip pending tag-assignment load: stg._pendg_demo_fold absent';
    RETURN;
  END IF;
  IF to_regclass('mysql_raw.crosswalk_pendg_pgm_dtl_tag') IS NULL THEN
    RAISE NOTICE 'skip pending tag-assignment load: mysql_raw.crosswalk_pendg_pgm_dtl_tag absent (run crosswalks phase)';
    RETURN;
  END IF;
  -- Per-source-table fold, driven by mysql_raw.crosswalk_pendg_pgm_dtl_tag
  -- (loaded from reports/pgm_dtl_tag_mapping_pending.csv). Entries with a blank
  -- tag_name are SME-pending and intentionally omitted. INERT until populated.
  FOR m IN
  SELECT
    source_table,
    tag_name,
    from_dt_col,
    to_dt_col
  FROM
    mysql_raw.crosswalk_pendg_pgm_dtl_tag
  WHERE
    COALESCE(tag_name, '') <> '' LOOP
        v_from := COALESCE(NULLIF(m.from_dt_col, ''), 'from_dt');
        v_to := COALESCE(NULLIF(m.to_dt_col, ''), 'to_dt');
        IF to_regclass('mysql_raw.' || m.source_table) IS NULL THEN
          RAISE NOTICE 'pending tag-assignment: source table mysql_raw.% absent -- skipped', m.source_table;
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
        RAISE NOTICE 'pending tag-assignment: tag_name % not a seeded demonstration-type tag -- skipped', m.tag_name;
        CONTINUE;
      END IF;
  -- Count source rows dropped for an unloadable period (NULL date or a
  -- non-positive window), reported alongside the load for SME backfill.
  EXECUTE format('SELECT count(*) FROM mysql_raw.%1$I s
        WHERE COALESCE(s.dltd_ind, 0) = 0
          AND (s.%2$I IS NULL OR s.%3$I IS NULL
            OR s.%2$I >= s.%3$I)', m.source_table, v_from, v_to) INTO skipped;
  skipped_ct := skipped_ct + skipped;
  EXECUTE format('INSERT INTO demos_app.demonstration_type_tag_assignment(demonstration_id, tag_name_id, tag_type_id, effective_date, expiration_date, created_at, updated_at)
    SELECT
      pf.demo_uuid, tg.tag_name_id, tg.tag_type_id, s.%1$I::timestamptz, s.%2$I::timestamptz, COALESCE(s.creatd_dt::timestamptz, now()), COALESCE(s.creatd_dt::timestamptz, now())
  FROM mysql_raw.%3$I s
  JOIN stg._pendg_demo_fold pf ON pf.legacy_pendg_demo_id = s.mdcd_pendg_demo_id
  JOIN demos_app.demonstration dem ON dem.id = pf.demo_uuid
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
  RAISE NOTICE 'pending tag-assignment load: % row(s) inserted, % source row(s) skipped for NULL or non-positive period', loaded_ct, skipped_ct;
END
$$;
