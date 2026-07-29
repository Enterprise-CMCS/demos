/*
 * Purpose:    Detect approved demonstrations whose 5-digit project numbers collide under different medicaid_ids (one waiver about to load as two demonstrations).
 * Inputs:     stg.demonstration_resolved; migration.state_region
 * Outputs:    migration._parity_approved_project_number_collision
 * Invariants: NON-GATING detector (report only -- resolving a collision means merging two already-valid approved demonstrations, which is an SME decision, not a loader one); zero live occurrences at authoring time; conditional-DDL guard; idempotent via CREATE OR REPLACE.
 * Refs:       migration/phases/parity.py (non-gating "Approved project-number collisions"); sql/10_stg/23_pendg_demo_fold.sql (the PENDING-side repair this deliberately does not mirror); sql/99_parity/14_demonstration_held_dup_medicaid.sql (the same-medicaid_id case)
 *
 * Parity: approved demonstrations sharing a project number under different
 * medicaid_ids.
 *
 * A CMS waiver number is `11-W-NNNNN/R`: the 5-digit NNNNN identifies the waiver
 * and R is the CMS regional office. NNNNN is issued centrally and belongs to one
 * demonstration, so two approved rows carrying the same NNNNN under DIFFERENT
 * medicaid_ids are the same waiver written two ways -- almost always a mistyped
 * region digit (the exact defect the pending fold repairs: pending 11-W-00289/5
 * vs approved 11-W-00289/7, both Iowa).
 *
 * Nothing detects that on the APPROVED anchor. The UNIQUE constraint is on the
 * whole medicaid_id, so `11-W-00036/3` and `11-W-00036/4` are distinct keys and
 * both load happily -- producing two demonstrations for one waiver, each with a
 * share of the amendments, contacts and tags. Check 21 does not see it either;
 * that one covers rows with the SAME medicaid_id.
 *
 * WHY THIS ONLY DETECTS, AND DOES NOT REPAIR
 *
 * The pending-side repair in sql/10_stg/23_pendg_demo_fold.sql is safe because a
 * pending row is not yet a demonstration: folding it changes no identity, it just
 * reparents its children onto the approved demonstration that already owns the
 * waiver. On this anchor BOTH rows are already valid approved demonstrations, so
 * "repairing" means choosing which medicaid_id is authoritative, discarding the
 * other, and merging two approved records' children. Which of the two is correct
 * is a question about the source, not about the data shape -- the state's CMS
 * region tells you which SUFFIX is right, but not whether the two rows are truly
 * one demonstration or a legitimate renumbering an SME wants kept apart.
 *
 * There are ZERO occurrences in the live source (verified against the built
 * target: no project number maps to more than one medicaid_id, in the same state
 * or across states). Automating a merge would therefore ship a code path whose
 * first-ever execution is on production data at cutover, to fix a problem that
 * does not exist. This view exists so that if the source acquires one before
 * cutover, it is visible rather than silent.
 *
 * NON-GATING per the cutover scope decision: it reports, and an SME resolves it
 * at the source.
 *
 * Conditional DDL: reads stg.demonstration_resolved and migration.state_region,
 * which exist only in the full pipeline, so each is guarded and the app-layers
 * idempotency harness applies this file as a clean no-op.
 */
SET search_path TO migration, stg, mysql_raw, demos_app, public;

DO $$
BEGIN
  IF to_regclass('stg.demonstration_resolved') IS NULL THEN
    RAISE NOTICE 'parity approved_project_number_collision: stg.demonstration_resolved absent; view not created';
    RETURN;
  END IF;
  IF to_regclass('migration.state_region') IS NULL THEN
    RAISE NOTICE 'parity approved_project_number_collision: migration.state_region absent; view not created';
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_approved_project_number_collision AS
    WITH numbered AS (
      SELECT
        r.legacy_demo_id,
        r.state_id,
        r.medicaid_id,
        migration.medicaid_project_number(r.medicaid_id) AS project_number
      FROM stg.demonstration_resolved r
      WHERE r.medicaid_id IS NOT NULL
    ),
    collided AS (
      SELECT project_number
      FROM numbered
      GROUP BY project_number
      HAVING count(DISTINCT medicaid_id) > 1
    )
    SELECT
      n.legacy_demo_id   AS legacy_demo_id,
      n.state_id         AS state_id,
      n.medicaid_id      AS medicaid_id,
      n.project_number   AS project_number,
      sr.region          AS state_region,
      -- The suffix a correctly-numbered waiver for this state would carry.
      (split_part(n.medicaid_id, '/', 2) = sr.region::text) AS region_matches_state,
      (
        SELECT string_agg(DISTINCT o.medicaid_id || ' (' || o.state_id || ' #' || o.legacy_demo_id || ')', ', ')
        FROM numbered o
        WHERE o.project_number = n.project_number
          AND o.legacy_demo_id <> n.legacy_demo_id
      )                  AS colliding_with,
      CASE
        WHEN (
          SELECT count(DISTINCT o.state_id) FROM numbered o WHERE o.project_number = n.project_number
        ) > 1
          THEN 'project number appears under more than one state; a 5-digit CMS project number belongs to one demonstration'
        ELSE 'same state and project number but a different region digit; one of the two region suffixes is mistyped and the waiver will load as two demonstrations'
      END                AS reason
    FROM numbered n
    JOIN collided c ON c.project_number = n.project_number
    LEFT JOIN migration.state_region sr ON sr.state_id = n.state_id;
  $v$;
END
$$;

