/*
 * Purpose:    Load the demos_app.application anchor + demos_app.demonstration from stg.demonstration_resolved, deriving status/phase/ids (medicaid_id is always legacy-preserved; chip_id is legacy-preserved when present, else left NULL and minted at INSERT by the migration_mode-gated generate_medicaid_chip_id_numbers trigger).
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division; migration.state_region; sequences demos_app.chip_id_number_seq / demos_app.medicaid_id_number_seq.
 * Outputs:    demos_app.application, demos_app.demonstration
 * Invariants: runs inside the deferred-constraint build_app txn (with demos_app.migration_mode='on'); FKs dropped during build, re-validated in the constraints phase; stamps application.is_migrated_from_pmda = TRUE so the specified cross-repo date/phase-validator relaxations have a flag to key on; fail-closed (a demo loads only when its status code is mapped and its state resolves); mirrors check_demonstration_non_null_fields_when_approved by holding back Approved rows missing sdg_division/effective/expiration (non-gating, logged to migration._parity_approved_demo_held); holds back duplicate-medicaid_id rows (RED-4) instead of violating demonstration_medicaid_id_key: among duplicates the region-suffix-correct row wins (lowest legacy id breaks a tie); a group whose region suffix matches NO member's state region is held ENTIRELY (no lowest-id fallback) and gates RED at parity check 21 (logged to migration._parity_demonstration_held_dup_medicaid_id); medicaid_id is always legacy-preserved and chip_id is legacy-preserved when the source carries a secondary 21-W number, else left NULL for the generate_medicaid_chip_id_numbers trigger to mint at INSERT (chip_id is NOT NULL); this loader still floors chip_id_number_seq above every preserved legacy 21-W number BEFORE the inserts so the trigger's minted values (and any later DEMOS in-app mint) start above -- and cannot collide with -- a preserved chip_id; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING (no row inserted on re-run means the trigger does not mint again, keeping chip_ids stable).
 * Refs:       reports/narrative/p1_demonstration_mapping_worksheet.md, sql/04_crosswalks/10_demo_status.sql, sql/99_parity/12_approved_demo_held_for_division.sql, docs/developer/reference-cross-cutting-derivations.adoc
 *
 * App load: demos_app.application (anchor) + demos_app.demonstration from the
 * PMDA demonstrations resolved in stg.demonstration_resolved (22_*).
 *
 * A demonstration IS-A application sharing one UUID (composite FK
 * demonstration(id, application_type_id) -> application(id, application_type_id)).
 * Both inserts run in the single deferred-constraint build_app transaction with
 * demos_app.migration_mode='on'; FKs are dropped during build and re-validated
 * in the constraints phase. The migration deploys ONLY the
 * generate_medicaid_chip_id_numbers mint trigger (at ddl time, verbatim from
 * server/src/sql/functions.sql); under migration_mode it legacy-preserves the
 * medicaid_id/chip_id set here and mints a chip_id for the NULL rows. The other
 * DEMOS application triggers (create_phases_and_dates_for_new_application,
 * check_demonstration_primary_project_officer, log_changes_*) stay ABSENT and
 * are deployed later by the DEMOS refreshDbObjects -- so status/phase are set
 * directly here (mirroring the dbt loader, which disables create_phases for the
 * load). Preflight P0.9 verifies exactly this trigger state.
 *
 * Column derivations (reports/narrative/p1_demonstration_mapping_worksheet.md):
 *   application_type_id  constant 'Demonstration'                       (§6.3)
 *   signature_level_id   constant 'OA' (demonstration CHECK forces it)  (§6.2)
 *   status_id            crosswalk_demo_status(mdcd_demo_stus_cd)       (§3)
 *   current_phase_id     date-derived (stg) -> Approved fallback -> Concept (§6.1)
 *   medicaid_id          mdcd_demo_num (legacy-preserved)               (§6.6)
 *   chip_id              mdcd_scndry_demo_num, else NULL -> minted at INSERT by the generate_medicaid_chip_id_numbers trigger (§6.6)
 *   effective/expiration state_prfmnc_yr_strt/end_dt
 *   sdg_division_id      crosswalk_sdg_division(mdcd_chip_div_cd) (data-backed
 *                        identity map; sentinel 0 / unmapped -> NULL)
 *
 * Fail-closed: a demo is loaded only when its status code is mapped (codes 1-9;
 * code 1 'Pending' -> 'Under Review' per decision D1, see
 * 04_crosswalks/10_demo_status.sql) AND its state resolves in
 * migration.state_region. Additionally, the DEMOS
 * CHECK check_demonstration_non_null_fields_when_approved rejects any Approved
 * demonstration with a NULL sdg_division_id / effective_date / expiration_date,
 * so an Approved row missing any of those is HELD BACK (not inserted) rather
 * than failing the whole build_app transaction. Held-back Approved rows are
 * logged per-row for SME review via the parity view
 * migration._parity_approved_demo_held (sql/99_parity/12_*), and counted in a
 * NOTICE here; per the cutover scope decision this does NOT hard-fail the gate.
 * The crosswalk completeness check (11_demo_status_check.sql) remains the hard
 * gate on status mapping. signature crosswalk (forced 'OA' by the demonstration
 * CHECK), application_date/application_phase materialization, tags, roles and
 * the primary project officer are deferred
 * (docs/developer/reference-cross-cutting-derivations.adoc).
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 * The sequence reconciliation recomputes from source/loaded data, so it is
 * stable across re-runs.
 *
 * chip_id: the loader preserves the legacy 21-W secondary number when present
 * and otherwise leaves chip_id NULL. chip_id is NOT NULL in the DEMOS schema, so
 * the generate_medicaid_chip_id_numbers BEFORE INSERT trigger (deployed at ddl
 * time, run with migration_mode='on') mints one from chip_id_number_seq for each
 * NULL row. This loader floors chip_id_number_seq above the largest preserved
 * legacy 21-W number BEFORE the inserts, so every minted value (and any later
 * DEMOS in-app mint) starts above -- and cannot collide with -- a preserved
 * chip_id. medicaid_id is always legacy-preserved (the trigger only mints when
 * NULL, which never happens here), so a post-load advance of
 * medicaid_id_number_seq likewise floors the later DEMOS minter above it.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
  held_gated int;
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'skip demonstration load: stg.demonstration_resolved not built yet';
    RETURN;
  END IF;
  -- Floor chip_id_number_seq above every preserved legacy 21-W number BEFORE the
  -- inserts, so the generate_medicaid_chip_id_numbers trigger mints the NULL rows
  -- from a value above them (and any later DEMOS in-app mint likewise) and cannot
  -- collide with a preserved chip_id.
  PERFORM
    setval('demos_app.chip_id_number_seq', GREATEST((
        SELECT
          last_value
        FROM demos_app.chip_id_number_seq),(
      SELECT
        COALESCE(max(substring(r.chip_id_legacy FROM '^21-W-0*([0-9]+)/')::int), 0)
      FROM stg.demonstration_resolved r)), TRUE);
  INSERT INTO demos_app.application(id, application_type_id, is_migrated_from_pmda)
  SELECT
    r.new_uuid,
    'Demonstration',
    -- DEMOS migration 20260721192255 added application.is_migrated_from_pmda
    -- (NOT NULL DEFAULT false). Nothing in server/src reads it yet, but the
    -- cross-repo Surface-B relaxations (a validateInputDates /
    -- checkPhaseCompletionRules skip for migrated applications) are specified to
    -- key on it, so the migration must stamp it or those skips would be inert.
    TRUE
  FROM
    stg.demonstration_resolved r
    JOIN mysql_raw.crosswalk_demo_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN migration.state_region sr ON sr.state_id = r.state_id
    LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.application ex
      WHERE
        ex.id = r.new_uuid)
    -- Mirror check_demonstration_non_null_fields_when_approved: hold back any
    -- Approved demo missing a required field rather than fail the transaction.
    AND NOT (cw.demos_text_id = 'Approved'
      AND (xdiv.demos_text_id IS NULL
        OR r.effective_date IS NULL
        OR r.expiration_date IS NULL))
    -- RED-4 duplicate-medicaid_id hold-back. DEMOS demonstration_medicaid_id_key
    -- is UNIQUE, yet the source can carry the same mdcd_demo_num on two live
    -- demonstrations (e.g. LA #2506 and TX #2513, both 11-W-00232/6). Rather than
    -- fail the whole build_app txn (ERROR 23505). Winner rule (SME-ratified):
    -- among duplicates sharing a medicaid_id the row whose CMS-region suffix (the
    -- /N; region 10 is written as a trailing 0) matches its state's region wins;
    -- if two or more match, the lowest legacy mdcd_demo_id breaks the tie. If NO
    -- duplicate matches its state's region the project number's region is wrong:
    -- the WHOLE group is held (none loaded) and parity check 21 gates RED for SME
    -- source-correction -- there is no lowest-id fallback in that case. Held rows
    -- are logged by sql/99_parity/14_demonstration_held_dup_medicaid.sql. So r
    -- loads iff it is a singleton (no other load-eligible row shares its
    -- medicaid_id) OR the region-correct winner (region-suffix match AND lowest
    -- legacy id among region-correct duplicates).
    AND (r.medicaid_id IS NULL
      OR NOT EXISTS (
        SELECT
          1
        FROM
          stg.demonstration_resolved r2
          JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
          JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
          LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
        WHERE
          r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND NOT (cw2.demos_text_id = 'Approved'
            AND (xd2.demos_text_id IS NULL
              OR r2.effective_date IS NULL
              OR r2.expiration_date IS NULL)))
        OR ((substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
            AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
              OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0'
                AND sr.region = 10)))
          AND NOT EXISTS (
            SELECT
              1
            FROM
              stg.demonstration_resolved r2
              JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
              JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
              LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
            WHERE
              r2.medicaid_id = r.medicaid_id
              AND r2.new_uuid <> r.new_uuid
              AND NOT (cw2.demos_text_id = 'Approved'
                AND (xd2.demos_text_id IS NULL
                  OR r2.effective_date IS NULL
                  OR r2.expiration_date IS NULL))
              AND substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
              AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0'
                  AND sr2.region = 10))
              AND r2.legacy_demo_id < r.legacy_demo_id)))
    ON CONFLICT (id)
    DO NOTHING;
  INSERT INTO demos_app.demonstration(id, application_type_id, name, description, effective_date, expiration_date, signature_level_id, sdg_division_id, status_id, current_phase_id, state_id, medicaid_id, chip_id, created_at, updated_at, status_updated_at)
  SELECT
    r.new_uuid,
    'Demonstration',
    r.name,
    r.description,
    r.effective_date,
    r.expiration_date,
    'OA',
    xdiv.demos_text_id,
    cw.demos_text_id,
    COALESCE(r.current_phase_by_date, CASE WHEN cw.demos_text_id = 'Approved' THEN
        'Approval Summary'
      END, 'Concept'),
    r.state_id,
    r.medicaid_id,
    -- Legacy 21-W secondary number when present, else NULL -> the
    -- generate_medicaid_chip_id_numbers trigger mints it at INSERT (migration_mode).
    r.chip_id_legacy,
    r.created_at,
    r.updated_at,
    -- DEMOS migration 20260616155913 added status_updated_at (NOT NULL, DEFAULT
    -- CURRENT_TIMESTAMP) and backfilled it to updated_at. Set it explicitly so a
    -- migrated demonstration preserves that convention instead of stamping the
    -- cutover instant.
    r.updated_at
  FROM
    stg.demonstration_resolved r
    JOIN mysql_raw.crosswalk_demo_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN migration.state_region sr ON sr.state_id = r.state_id
    LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.demonstration ex
      WHERE
        ex.id = r.new_uuid)
    AND NOT (cw.demos_text_id = 'Approved'
      AND (xdiv.demos_text_id IS NULL
        OR r.effective_date IS NULL
        OR r.expiration_date IS NULL))
    -- RED-4 duplicate-medicaid_id hold-back (see the application INSERT above for
    -- the winner rule); kept identical so the anchor and the demonstration hold
    -- back exactly the same rows.
    AND (r.medicaid_id IS NULL
      OR NOT EXISTS (
        SELECT
          1
        FROM
          stg.demonstration_resolved r2
          JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
          JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
          LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
        WHERE
          r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND NOT (cw2.demos_text_id = 'Approved'
            AND (xd2.demos_text_id IS NULL
              OR r2.effective_date IS NULL
              OR r2.expiration_date IS NULL)))
        OR ((substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
            AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
              OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0'
                AND sr.region = 10)))
          AND NOT EXISTS (
            SELECT
              1
            FROM
              stg.demonstration_resolved r2
              JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
              JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
              LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
            WHERE
              r2.medicaid_id = r.medicaid_id
              AND r2.new_uuid <> r.new_uuid
              AND NOT (cw2.demos_text_id = 'Approved'
                AND (xd2.demos_text_id IS NULL
                  OR r2.effective_date IS NULL
                  OR r2.expiration_date IS NULL))
              AND substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
              AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0'
                  AND sr2.region = 10))
              AND r2.legacy_demo_id < r.legacy_demo_id)))
    ON CONFLICT (id)
    DO NOTHING;
  SELECT
    count(*)
  INTO
    held
  FROM
    stg.demonstration_resolved r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        mysql_raw.crosswalk_demo_status cw
      WHERE
        cw.legacy_int_cd = r.status_cd)
    OR NOT EXISTS (
      SELECT
        1
      FROM
        migration.state_region sr
      WHERE
        sr.state_id = r.state_id);
  IF held > 0 THEN
    RAISE NOTICE 'demonstration load: % demo(s) held back (status code unmapped/withheld or state unresolvable)', held;
  END IF;
  -- Count Approved demos held back for a missing required field (sdg_division /
  -- effective_date / expiration_date). These are logged per-row for SME review
  -- by sql/99_parity/12_approved_demo_held_for_division.sql; per the cutover
  -- scope decision this is a non-gating hold-back, not a hard failure.
  SELECT
    count(*)
  INTO
    held
  FROM
    stg.demonstration_resolved r
    JOIN mysql_raw.crosswalk_demo_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN migration.state_region sr ON sr.state_id = r.state_id
    LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
  WHERE
    cw.demos_text_id = 'Approved'
    AND (xdiv.demos_text_id IS NULL
      OR r.effective_date IS NULL
      OR r.expiration_date IS NULL);
  IF held > 0 THEN
    RAISE NOTICE 'demonstration load: % Approved demo(s) held back for a missing required field (sdg_division/effective/expiration); see migration._parity_approved_demo_held', held;
  END IF;
  -- Count demonstrations held back for a duplicate medicaid_id (RED-4). Two
  -- kinds: (a) the non-winning rows of a group that HAS a region-correct winner
  -- (legit, non-gating), and (b) EVERY row of a group whose region suffix
  -- matches no member's state region (source region wrong) -- the whole group is
  -- held and parity check 21 gates RED. Logged per-row by
  -- sql/99_parity/14_demonstration_held_dup_medicaid.sql.
  SELECT
    coalesce(sum(
        CASE WHEN grp_size > 1
          AND NOT is_winner THEN
          1
        ELSE
          0
        END), 0),
    coalesce(sum(
        CASE WHEN grp_size > 1
          AND NOT has_match THEN
          1
        ELSE
          0
        END), 0)
  INTO
    held,
    held_gated
  FROM (
    SELECT
      x.is_region_correct,
      count(*) OVER (PARTITION BY x.medicaid_id) AS grp_size,
      bool_or(x.is_region_correct) OVER (PARTITION BY x.medicaid_id) AS has_match,
(x.is_region_correct
        AND x.legacy_demo_id = min(x.legacy_demo_id) FILTER (WHERE x.is_region_correct) OVER (PARTITION BY x.medicaid_id)) AS is_winner
    FROM (
      SELECT
        r.medicaid_id,
        r.legacy_demo_id,
(substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
          AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
            OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0'
              AND sr.region = 10))) AS is_region_correct
      FROM
        stg.demonstration_resolved r
        JOIN mysql_raw.crosswalk_demo_status cw ON cw.legacy_int_cd = r.status_cd
        JOIN migration.state_region sr ON sr.state_id = r.state_id
        LEFT JOIN mysql_raw.crosswalk_sdg_division xdiv ON xdiv.legacy_int_cd = r.sdg_division_cd
      WHERE
        r.medicaid_id IS NOT NULL
        AND NOT (cw.demos_text_id = 'Approved'
          AND (xdiv.demos_text_id IS NULL
            OR r.effective_date IS NULL
            OR r.expiration_date IS NULL))) x) g;
  IF held > 0 THEN
    RAISE NOTICE 'demonstration load: % demo(s) held back for a duplicate medicaid_id (incl. % in region-incorrect groups that gate RED at parity check 21); see migration._parity_demonstration_held_dup_medicaid_id', held, held_gated;
  END IF;
  -- Advance the medicaid sequence past the largest legacy-preserved 11-W number
  -- so a later DEMOS app insert cannot mint a colliding medicaid_id. (The chip
  -- sequence was floored the same way above, before the load.)
  PERFORM
    setval('demos_app.medicaid_id_number_seq', GREATEST((
        SELECT
          last_value
        FROM demos_app.medicaid_id_number_seq),(
      SELECT
        COALESCE(max(substring(medicaid_id FROM '^11-W-0*([0-9]+)/')::int), 0)
      FROM demos_app.demonstration)), TRUE);
END
$$;

