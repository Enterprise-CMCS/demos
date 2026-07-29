/*
 * Purpose: Define the cross-layer migration helper functions (lookup_uuid, assert_zero, crosswalk) that stg and app transforms call into.
 * Refs:    -
 *
 * Helper functions used across stg and app transforms.
 *
 * Three small utilities are defined here; they have to exist before
 * any sql/05_id_maps, sql/10_stg or sql/20_app file that calls
 * into them.
 *
 *   migration.lookup_uuid(table, legacy_id)
 *     Translate a MySQL integer PK into the DEMOS UUID by reading the
 *     matching `migration._id_map_<table>` row. STABLE because the
 *     id_map tables are append-only within a single build.
 *
 *   migration.assert_zero(label, count)
 *     Cheap inline guardrail for stg/app transforms: raise if `count`
 *     is non-zero. Used to abort a build when a parity sub-query
 *     returns unexpected rows.
 *
 *   migration.crosswalk(rfrnc, legacy_cd)
 *     Translate a MySQL reference-table code into the canonical DEMOS
 *     text id via `mysql_raw.crosswalk_<rfrnc>`. Raises when the legacy
 *     code is non-null but unmapped so SMEs notice missing crosswalk
 *     rows instead of silently dropping data.
 *
 *   migration.normalize_waiver_number(text, prefix)
 *     Shared core for the two waiver-number normalizers below, parameterized on
 *     the `11` (Medicaid) / `21` (CHIP) prefix so the strip-reassemble-revalidate
 *     rule -- including the region-10 handling -- lives in exactly one place and
 *     the Medicaid and CHIP fields cannot drift apart.
 *
 *   migration.normalize_medicaid_id(text) / migration.normalize_chip_id(text)
 *     Standardize a legacy Medicaid / CHIP demonstration number into the DEMOS
 *     canonical form `11-W-NNNNN/R` / `21-W-NNNNN/R`, or return NULL when it
 *     cannot be rescued (fail-closed). Strips `-`, `/` and whitespace, then
 *     requires the stripped value to be the prefix + `W` + a 5-digit project
 *     number + a region, reassembles it, and re-validates against the canonical
 *     regex so anything ambiguous or in the WRONG FIELD (a `21-W` CHIP id in the
 *     Medicaid column, or the `11-W` Medicaid id and the literal 'None' that the
 *     source carries in the CHIP column) returns NULL. IMMUTABLE + STRICT
 *     (NULL in, NULL out).
 *
 *     Region 10 arrives in the source two ways -- spelled `/10`, and as a bare
 *     trailing `0` -- and BOTH normalize to the canonical `/10`. See the inline
 *     comment on the region CASE for the evidence; this is a deliberate
 *     divergence from the dbt strip-and-reassemble standardization
 *     (data/migration/stage_pmda_for_migration/MIGRATION_LOGIC.md), which drops
 *     the bare-0 spelling and so loses all of CMS region 10.
 *
 *   migration.medicaid_project_number(text)
 *     The 5-digit project number alone, from a normalizable Medicaid id (NULL
 *     otherwise). The pending/approved fold uses it as a region-insensitive
 *     match key so a pending row whose region digit was mis-keyed still folds
 *     into its approved counterpart instead of minting a duplicate
 *     demonstration; see sql/10_stg/23_pendg_demo_fold.sql.
 *
 *     normalize_medicaid_id is shared by the row-level filters
 *     (sql/10_stg/10_filter_demo.sql, 11_filter_pendg_demo.sql), the
 *     pending/approved fold (23_pendg_demo_fold.sql), the demonstration
 *     projection (22_demonstration_resolved.sql) and the violations report
 *     (99_filter_report.sql), so the kept set, the fold key, the emitted
 *     medicaid_id and the SME-facing report can never drift.
 *
 *   migration.eastern_day_start(date) / migration.eastern_day_end(date)
 *     Anchor a legacy calendar date to the DEMOS timestamptz convention:
 *     midnight (start-of-day) or 23:59:59.999 (end-of-day) in
 *     America/New_York, expressed as a UTC instant. This reproduces the
 *     DEMOS server write path (server/src/dateUtilities.ts +
 *     server/src/sql/functions.sql) so migrated dates round-trip through
 *     `... AT TIME ZONE 'America/New_York'` (reports) and the client's
 *     local-tz formatting on the correct calendar day, instead of the
 *     day-early shift a bare `date::timestamptz` (midnight UTC) produces.
 *     STABLE (the value depends on the tz database) and STRICT (NULL in,
 *     NULL out). DST-aware: the offset is -05:00 (EST) or -04:00 (EDT)
 *     per the input date.
 *
 *   migration.derive_amendment_status(mapped_status, parent_is_pending, status_cd, effective_date)
 *     Resolve an amendment's DEMOS application_status id from its source
 *     signals -- the single source of truth the loader (sql/20_app/35) and the
 *     parity views (sql/99_parity/52) share so a fail-closed drop and the RED
 *     gate that reports it never drift. Precedence:
 *       1. mapped_status  -- the crosswalk_amendment_status text id when the
 *          source status_cd maps (the caller's LEFT JOIN supplies it);
 *       2. else a pending-track amendment (statusless, pending parent)
 *          -> 'Under Review';
 *       3. else a statusless approved-track amendment (status_cd IS NULL) is
 *          date-tiered: an amndmt_prd_from_dt-derived effective_date present
 *          implies an approved amendment period -> 'Approved'; no date
 *          provenance -> 'Under Review'.
 *     A non-NULL but UNMAPPED status_cd returns NULL so the caller drops it
 *     fail-closed (surfaced RED by 99_parity/52; also caught at cutover by
 *     04_crosswalks/65). IMMUTABLE: a pure function of its arguments (the
 *     crosswalk lookup stays in the caller's LEFT JOIN, not re-done here).
 */
CREATE OR REPLACE FUNCTION migration.lookup_uuid(p_table text, p_legacy_id bigint)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  AS $$
DECLARE
  v_uuid uuid;
  v_sql text;
BEGIN
  IF p_legacy_id IS NULL THEN
    RETURN NULL;
  END IF;
  v_sql := format('SELECT new_uuid FROM migration._id_map_%I WHERE legacy_int_id = $1', p_table);
  EXECUTE v_sql INTO v_uuid
  USING p_legacy_id;
  RETURN v_uuid;
END
$$;

CREATE OR REPLACE FUNCTION migration.assert_zero(p_label text, p_count bigint)
  RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF p_count <> 0 THEN
    RAISE EXCEPTION 'assertion % failed: expected 0, got %', p_label, p_count;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION migration.crosswalk(p_rfrnc text, p_legacy_cd int)
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  AS $$
DECLARE
  v_id text;
  v_sql text;
BEGIN
  IF p_legacy_cd IS NULL THEN
    RETURN NULL;
  END IF;
  v_sql := format('SELECT demos_text_id FROM mysql_raw.crosswalk_%I WHERE legacy_int_cd = $1', p_rfrnc);
  EXECUTE v_sql INTO v_id
  USING p_legacy_cd;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'crosswalk % missing for legacy code %', p_rfrnc, p_legacy_cd;
  END IF;
  RETURN v_id;
END
$$;

CREATE OR REPLACE FUNCTION migration.normalize_waiver_number(p_raw text, p_prefix text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE STRICT
  AS $$
  WITH stripped AS(
    -- upper() so the 'W' matches in any casing. The live source is all
    -- uppercase today (zero lowercase occurrences in mdcd_demo,
    -- mdcd_pendg_demo or mdcd_scndry_demo_num), so this rescues nothing
    -- currently -- it removes a silent-drop mode, since a lowercase 'w'
    -- entered before cutover would otherwise fail the shape test and take the
    -- whole demonstration out of the migration.
    SELECT
      regexp_replace(upper(p_raw), '[-/[:space:]]', '', 'g') AS s
),
parsed AS(
  SELECT
    substring(s, 4, 5) AS project,
    CASE
    -- Region 10 spelled in full: the stripped value is 10 chars.
    WHEN length(s) = 10
      AND
      right(s,
        2) = '10' THEN
      '10'
      -- PMDA also spells CMS region 10 as a BARE TRAILING 0. Every such row
      -- in the source is an AK/ID/OR/WA demonstration and those four states
      -- are exactly CMS region 10 (sql/02_seeds_static/25_state_region.sql),
      -- with zero counterexamples in either direction, so a trailing 0 is
      -- unambiguously region 10 and not a region 0 (which does not exist).
      -- Emitted in the DEMOS canonical '/10' form -- the form the
      -- generate_medicaid_chip_id_numbers mint trigger itself produces from
      -- state.region -- so a migrated id is indistinguishable in shape from
      -- an in-app minted one. Dropping these instead (what the canonical
      -- regex did before, and what the dbt slice still does) silently loses
      -- an entire CMS region: see docs/specs/data-dbt-alignment-spec.md.
    WHEN length(s) = 9
      AND substring(s, 9) = '0' THEN
      '10'
    WHEN length(s) = 9 THEN
      substring(s, 9)
    END AS region
  FROM
    stripped
  WHERE
    s ~('^' || p_prefix || 'W[0-9]{6,7}$'))
SELECT
  p_prefix || '-W-' || project || '/' || region
FROM
  parsed
WHERE
  region IS NOT NULL
  -- An all-zeros project number is a placeholder, never an issued waiver:
  -- DEMOS mints from nextval() via lpad(...,5,'0'), which cannot produce
  -- 00000. Rejecting it matters because the region rule above would
  -- otherwise rescue the source's literal '11W000000' into a well-formed
  -- '11-W-00000/10' and load it as a real demonstration.
  AND project <> '00000'
  AND(p_prefix || '-W-' || project || '/' || region) ~('^' || p_prefix || '-W-[0-9]{5}/(10|[1-9])$');
$$;

CREATE OR REPLACE FUNCTION migration.normalize_medicaid_id(p_raw text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE STRICT
  AS $$
  SELECT
    migration.normalize_waiver_number(p_raw, '11');
$$;

CREATE OR REPLACE FUNCTION migration.normalize_chip_id(p_raw text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE STRICT
  AS $$
  SELECT
    migration.normalize_waiver_number(p_raw, '21');
$$;

CREATE OR REPLACE FUNCTION migration.medicaid_project_number(p_raw text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE STRICT
  AS $$
  SELECT
    substring(migration.normalize_medicaid_id(p_raw)
      FROM '^11-W-([0-9]{5})/');
$$;

CREATE OR REPLACE FUNCTION migration.eastern_day_start(p_date date)
  RETURNS timestamptz
  LANGUAGE sql
  STABLE STRICT
  AS $$
  SELECT
    timezone('America/New_York', p_date::timestamp);
$$;

CREATE OR REPLACE FUNCTION migration.eastern_day_end(p_date date)
  RETURNS timestamptz
  LANGUAGE sql
  STABLE STRICT
  AS $$
  SELECT
    timezone('America/New_York', p_date::timestamp + interval '1 day' - interval '1 millisecond');
$$;

CREATE OR REPLACE FUNCTION migration.derive_amendment_status(p_mapped_status text, p_parent_is_pending boolean, p_status_cd int, p_effective_date timestamptz)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  AS $$
  SELECT
    COALESCE(p_mapped_status, CASE WHEN p_parent_is_pending THEN
        'Under Review'
      END, CASE WHEN p_status_cd IS NULL THEN
        CASE WHEN p_effective_date IS NOT NULL THEN
          'Approved'
        ELSE
          'Under Review'
      END
      END);
$$;

