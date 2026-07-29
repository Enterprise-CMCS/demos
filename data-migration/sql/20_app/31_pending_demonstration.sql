/*
 * Purpose:    Load the demos_app.application anchor + demos_app.demonstration for loadable ORPHAN pending demonstrations, uniformly 'Under Review'.
 * Inputs:     stg.pending_demonstration_resolved; mysql_raw.crosswalk_sdg_division; migration.state_region; sequence demos_app.medicaid_id_number_seq.
 * Outputs:    demos_app.application, demos_app.demonstration
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; fail-closed (a pending demo loads only when its state resolves in migration.state_region); status is uniformly 'Under Review' (mdcd_pendg_demo has no status column); chip_id is always NULL (mdcd_pendg_demo has no secondary-number column); holds back the non-winning row of a duplicate medicaid_id (RED-4) instead of violating demonstration_medicaid_id_key (non-gating, logged by sql/99_parity/04); idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING; guarded inert until stg.pending_demonstration_resolved exists.
 * Refs:       sql/20_app/30_demonstration.sql, sql/10_stg/24_pending_demonstration_resolved.sql, reports/narrative/pending_approved_decisions.md
 *
 * App load: demos_app.application (anchor) + demos_app.demonstration from the
 * loadable ORPHAN pending demonstrations resolved in
 * stg.pending_demonstration_resolved (10_stg/24). This is the workflow-7
 * "pending demonstrations" load: a pending demo with a project number and no
 * approved counterpart migrates as its own 'Under Review' demonstration;
 * folded and no-project-number pending demos were already excluded upstream by
 * stg._pendg_demo_fold.
 *
 * Mirrors sql/20_app/30_demonstration.sql (the approved-demo loader), simplified
 * for the pending shape:
 *   status_id            constant 'Under Review' (no source status column)
 *   current_phase_id     date-derived (stg) -> Concept fallback (never
 *                        'Approval Summary': a pending demo is not approved)
 *   chip_id              always NULL (no secondary-number column, and CMS/DEMOS
 *                        -- not the migration -- assigns CHIP ids; see the
 *                        2026-07-10 chip-id decision)
 *   signature_level_id   constant 'OA' (the demonstration CHECK forces it)
 *   sdg_division_id      crosswalk_sdg_division(mdcd_chip_div_cd); sentinel 0 /
 *                        unmapped -> NULL
 *   medicaid_id          mdcd_demo_num (legacy-preserved; present by construction)
 *
 * Fail-closed: a pending demo loads only when its state resolves in
 * migration.state_region (a NULL/unrecognized state cascades it out). There is
 * no Approved-field hold-back here (a pending demo is never Approved). Because a
 * pending orphan has, by definition, no approved counterpart sharing its project
 * number, its medicaid_id cannot collide with an approved demonstration; it can
 * still collide with ANOTHER orphan pending demo carrying the same project
 * number, so the RED-4 duplicate-medicaid_id hold-back is applied among the
 * pending orphans (same winner rule as 30_demonstration.sql: the row whose
 * medicaid_id region suffix matches its state's region wins, then the lowest
 * legacy mdcd_pendg_demo_id). Held-back rows are logged for SME review by
 * sql/99_parity/04_pending_approved.sql; per the cutover scope decision this is
 * a non-gating hold-back, not a hard failure.
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 * Guarded: a clean no-op before stg.pending_demonstration_resolved exists (e.g.
 * the demos_app-only idempotency harness), mirroring 30_demonstration.sql.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.pending_demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'skip pending demonstration load: stg.pending_demonstration_resolved not built yet';
    RETURN;
  END IF;
  INSERT INTO demos_app.application(id, application_type_id)
  SELECT
    r.new_uuid,
    'Demonstration'
  FROM
    stg.pending_demonstration_resolved r
    JOIN migration.state_region sr ON sr.state_id = r.state_id
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.application ex
      WHERE
        ex.id = r.new_uuid)
    -- RED-4 duplicate-medicaid_id hold-back (see the demonstration INSERT below
    -- for the winner rule); kept identical so the anchor and the demonstration
    -- hold back exactly the same rows.
    AND (r.medicaid_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM stg.pending_demonstration_resolved r2
        JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
        WHERE r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND (CASE WHEN substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                  OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0' AND sr2.region = 10))
                THEN 0 ELSE 1 END, r2.legacy_pendg_demo_id)
            < (CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
                  OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
                THEN 0 ELSE 1 END, r.legacy_pendg_demo_id)))
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
    'Under Review',
    COALESCE(r.current_phase_by_date, 'Concept'),
    r.state_id,
    r.medicaid_id,
    NULL,
    r.created_at,
    r.updated_at,
    r.updated_at
  FROM
    stg.pending_demonstration_resolved r
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
    -- RED-4 duplicate-medicaid_id hold-back. DEMOS demonstration_medicaid_id_key
    -- is UNIQUE, and two orphan pending demos can carry the same mdcd_demo_num
    -- (e.g. legacy ids 197/252/256 are all 11-W-00036/4). Load ONE deterministic
    -- winner per medicaid_id and hold the rest back rather than fail the whole
    -- build_app txn. Winner rule (SME-ratified, matching 30_demonstration.sql):
    -- the row whose medicaid_id CMS-region suffix (the /N; region 10 is written
    -- as a trailing 0) matches its state's region wins, then the lowest legacy
    -- mdcd_pendg_demo_id.
    AND (r.medicaid_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM stg.pending_demonstration_resolved r2
        JOIN migration.state_region sr2 ON sr2.state_id = r2.state_id
        WHERE r2.medicaid_id = r.medicaid_id
          AND r2.new_uuid <> r.new_uuid
          AND (CASE WHEN substring(r2.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r2.medicaid_id FROM '/([0-9]+)$')::int = sr2.region
                  OR (substring(r2.medicaid_id FROM '/([0-9]+)$') = '0' AND sr2.region = 10))
                THEN 0 ELSE 1 END, r2.legacy_pendg_demo_id)
            < (CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
                AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
                  OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
                THEN 0 ELSE 1 END, r.legacy_pendg_demo_id)))
  ON CONFLICT (id)
    DO NOTHING;
  -- Held back (state unresolvable): a pending orphan whose state does not resolve
  -- in migration.state_region is not loaded. Logged non-gating.
  SELECT
    count(*) INTO held
  FROM
    stg.pending_demonstration_resolved r
  WHERE
    NOT EXISTS (
      SELECT
        1
      FROM
        migration.state_region sr
      WHERE
        sr.state_id = r.state_id);
  IF held > 0 THEN
    RAISE NOTICE 'pending demonstration load: % pending demo(s) held back (state unresolvable)', held;
  END IF;
  -- Held back (duplicate medicaid_id): the non-winning rows of a shared project
  -- number. Logged per-row for SME review by sql/99_parity/04_pending_approved.sql.
  SELECT
    count(*) INTO held
  FROM (
    SELECT
      ROW_NUMBER() OVER (PARTITION BY r.medicaid_id ORDER BY
        CASE WHEN substring(r.medicaid_id FROM '/([0-9]+)$') IS NOT NULL
          AND (substring(r.medicaid_id FROM '/([0-9]+)$')::int = sr.region
            OR (substring(r.medicaid_id FROM '/([0-9]+)$') = '0' AND sr.region = 10))
          THEN 0 ELSE 1 END,
        r.legacy_pendg_demo_id) AS rn
    FROM
      stg.pending_demonstration_resolved r
      JOIN migration.state_region sr ON sr.state_id = r.state_id
    WHERE
      r.medicaid_id IS NOT NULL) ranked
  WHERE
    ranked.rn > 1;
  IF held > 0 THEN
    RAISE NOTICE 'pending demonstration load: % pending demo(s) held back as the non-winning row of a duplicate medicaid_id; see migration._parity_pending_demonstration_held', held;
  END IF;
  -- Advance the medicaid sequence past the largest legacy-preserved 11-W number
  -- so a later DEMOS app insert cannot mint a colliding medicaid_id. Recomputed
  -- from all loaded demonstrations (approved + pending), so it is stable and
  -- order-independent with sql/20_app/30_demonstration.sql.
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
