/*
 * Purpose:    Load the demos_app.application anchor + demos_app.demonstration from stg.demonstration_resolved, deriving status/phase/ids and minting chip_id fallbacks.
 * Inputs:     stg.demonstration_resolved; mysql_raw.crosswalk_demo_status; mysql_raw.crosswalk_sdg_division; migration.state_region; sequences demos_app.chip_id_number_seq / demos_app.medicaid_id_number_seq.
 * Outputs:    demos_app.application, demos_app.demonstration
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; fail-closed (a demo loads only when its status code is mapped and its state resolves); mirrors check_demonstration_non_null_fields_when_approved by holding back Approved rows missing sdg_division/effective/expiration (non-gating, logged to migration._parity_approved_demo_held); holds back the non-winning row of a duplicate medicaid_id (RED-4) instead of violating demonstration_medicaid_id_key (non-gating, logged to migration._parity_demonstration_held_dup_medicaid_id); pre-advances chip_id_number_seq before minting so a minted chip_id cannot collide with a preserved one; idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING (keeps nextval stable on re-run).
 * Refs:       reports/narrative/p1_demonstration_mapping_worksheet.md, sql/04_crosswalks/10_demo_status.sql, sql/99_parity/12_approved_demo_held_for_division.sql, docs/specs/pmda-cross-cutting-derivation-spec.md
 *
 * App load: demos_app.application (anchor) + demos_app.demonstration from the
 * PMDA demonstrations resolved in stg.demonstration_resolved (22_*).
 *
 * A demonstration IS-A application sharing one UUID (composite FK
 * demonstration(id, application_type_id) -> application(id, application_type_id)).
 * Both inserts run in the single deferred-constraint build_app transaction; FKs
 * are dropped during build and re-validated in the constraints phase, and the
 * DEMOS application triggers (generate_medicaid_chip_id_numbers,
 * create_phases_and_dates_for_new_application, check_demonstration_primary_project_officer,
 * log_changes_*) are deployed later by the DEMOS ln.ts -- so no trigger
 * orchestration is needed here and ids/phase are set directly.
 *
 * Column derivations (reports/narrative/p1_demonstration_mapping_worksheet.md):
 *   application_type_id  constant 'Demonstration'                       (§6.3)
 *   signature_level_id   constant 'OA' (demonstration CHECK forces it)  (§6.2)
 *   status_id            crosswalk_demo_status(mdcd_demo_stus_cd)       (§3)
 *   current_phase_id     date-derived (stg) -> Approved fallback -> Concept (§6.1)
 *   medicaid_id          mdcd_demo_num (legacy-preserved)               (§6.6)
 *   chip_id              mdcd_scndry_demo_num, else minted 21-W-<seq>/<region> (§6.6)
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
 * (docs/specs/pmda-cross-cutting-derivation-spec.md).
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op,
 * which also stops the chip mint nextval from advancing on re-runs. The
 * sequence reconciliation recomputes from loaded data, so it is stable too.
 *
 * chip_id_number_seq STARTS AT 1000 and DEMOS only ever mints onto an empty
 * table, so it has no legacy 21-W numbers to dodge. We do: we both preserve
 * legacy secondary numbers and mint fallbacks from that one sequence, so we
 * pre-advance the sequence past the largest legacy 21-W number BEFORE minting,
 * guaranteeing every minted chip_id sorts above (and cannot collide with) a
 * preserved one in the same load. medicaid_id is always legacy-preserved (never
 * minted), so only a post-load advance (for the later DEMOS minter) is needed.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'skip demonstration load: stg.demonstration_resolved not built yet';
    RETURN;
  END IF;
  -- Pre-advance the chip sequence past every preserved legacy 21-W number so a
  -- minted fallback below cannot collide with one in the same batch.
  PERFORM
    setval('demos_app.chip_id_number_seq', GREATEST((
        SELECT
          last_value
        FROM demos_app.chip_id_number_seq),(
      SELECT
        COALESCE(max(substring(r.chip_id_legacy FROM '^21-W-0*([0-9]+)/')::int), 0)
      FROM stg.demonstration_resolved r)), TRUE);
  INSERT INTO demos_app.application(id, application_type_id)
  SELECT
    r.new_uuid,
    'Demonstration'
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
    -- fail the whole build_app txn (ERROR 23505), load ONE deterministic winner
    -- per medicaid_id and hold the rest back (logged per row by
    -- sql/99_parity/14_demonstration_held_dup_medicaid.sql). Winner rule
    -- (SME-ratified): the row whose medicaid_id CMS-region suffix (the /N; region
    -- 10 is written as a trailing 0) matches its state's region wins, then the
    -- lowest legacy mdcd_demo_id. Keep r unless a better-ranked, load-eligible
    -- duplicate exists.
    AND (r.medicaid_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM stg.demonstration_resolved r2
        JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
        JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
        LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
        WHERE r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND NOT (cw2.demos_text_id = 'Approved'
            AND (xd2.demos_text_id IS NULL
              OR r2.effective_date IS NULL
              OR r2.expiration_date IS NULL))
          AND (CASE WHEN substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                  OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0' AND sr2.region = 10))
                THEN 0 ELSE 1 END, r2.legacy_demo_id)
            < (CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
                  OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
                THEN 0 ELSE 1 END, r.legacy_demo_id)))
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
    CASE WHEN r.chip_id_legacy IS NOT NULL THEN
      r.chip_id_legacy
    ELSE
      format('21-W-%s/%s', lpad(nextval('demos_app.chip_id_number_seq')::text, 5, '0'), sr.region)
    END,
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
        SELECT 1
        FROM stg.demonstration_resolved r2
        JOIN mysql_raw.crosswalk_demo_status cw2 ON cw2.legacy_int_cd = r2.status_cd
        JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
        LEFT JOIN mysql_raw.crosswalk_sdg_division xd2 ON xd2.legacy_int_cd = r2.sdg_division_cd
        WHERE r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND NOT (cw2.demos_text_id = 'Approved'
            AND (xd2.demos_text_id IS NULL
              OR r2.effective_date IS NULL
              OR r2.expiration_date IS NULL))
          AND (CASE WHEN substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                  OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0' AND sr2.region = 10))
                THEN 0 ELSE 1 END, r2.legacy_demo_id)
            < (CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
                  OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
                THEN 0 ELSE 1 END, r.legacy_demo_id)))
  ON CONFLICT (id)
    DO NOTHING;
  SELECT
    count(*) INTO held
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
    count(*) INTO held
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
  -- Count demonstrations held back as the non-winning row of a duplicate
  -- medicaid_id (RED-4). Logged per-row for SME review by
  -- sql/99_parity/14_demonstration_held_dup_medicaid.sql; non-gating.
  SELECT
    count(*) INTO held
  FROM (
    SELECT
      ROW_NUMBER() OVER (PARTITION BY r.medicaid_id ORDER BY
        CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
          AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
            OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
          THEN 0 ELSE 1 END,
        r.legacy_demo_id) AS rn
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
          OR r.expiration_date IS NULL))
  ) ranked
  WHERE ranked.rn > 1;
  IF held > 0 THEN
    RAISE NOTICE 'demonstration load: % demo(s) held back as the non-winning row of a duplicate medicaid_id; see migration._parity_demonstration_held_dup_medicaid_id', held;
  END IF;
  -- Advance the medicaid sequence past the largest legacy-preserved 11-W number
  -- so a later DEMOS app insert cannot mint a colliding medicaid_id. (The chip
  -- sequence is already past every loaded value from the pre-advance + minting.)
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

