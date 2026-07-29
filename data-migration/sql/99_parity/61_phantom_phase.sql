/*
 * Purpose:    Durable per-row log of "phantom" phase completions: application_phase rows the migration stamped 'Completed' whose DEMOS completion requirements (dates, documents, prior phases) are not actually met.
 * Inputs:     demos_app.application_phase; demos_app.application_date; demos_app.document; demos_app.demonstration; demos_app.amendment; demos_app.extension; migration.phase_completion_rule
 * Outputs:    migration._parity_phantom_phase; migration._parity_phantom_phase_summary
 * Invariants: NON-GATING (quantifies a known, accepted consequence of status-derived phases; does not RED the gate); conditional-DDL guarded so it is a no-op on harnesses that never build application_phase; idempotent via CREATE OR REPLACE.
 * Refs:       sql/02_seeds_static/35_phase_completion_rule.sql; sql/23_app_derived/50_application_phase.sql; server/src/model/applicationPhase/checkPhaseCompletionRules.ts; docs/specs/api-validation-migration-audit-spec.md
 *
 * DEMOS enforces phase completion in application code (checkPhaseCompletionRules),
 * not in the database. Bulk-loading application_phase therefore cannot trip it,
 * and DEMOS never re-validates a row that already says 'Completed'. The
 * migration derives phase status from legacy PMDA status codes, which say
 * nothing about whether the required dates, documents, or prior phases exist --
 * so some completions are "phantom": true in the row, false in the evidence.
 *
 * This is a known and accepted consequence (the audit spec downgrades it from
 * Tier 0 to Tier 2) because it neither breaks the load nor blocks a user. It
 * bites only when someone reopens such a phase and tries to re-complete it:
 * then the gate runs for real and demands evidence that was never migrated.
 * The point of this view is to replace the spec's prose estimate with an exact,
 * per-row, re-runnable count so SMEs can see the true blast radius.
 *
 * Reading the output:
 *   unmet_kind = 'document'  is expected to dominate and is NOT a defect.
 *     Document migration is out of scope for this repo (operator decision
 *     2026-07-27, see reports/narrative/notes.md), so demos_app.document is
 *     empty and every document requirement is unmet by construction. Kept in
 *     the view rather than filtered out because it is a real precondition a
 *     user will hit, and because the count self-corrects if documents ever land.
 *   unmet_kind = 'date'      is the actionable signal: a date DEMOS considers
 *     mandatory that PMDA never carried.
 *   unmet_kind = 'phase'     means an earlier phase is not Completed, which can
 *     happen legitimately when a legacy status skips ahead.
 *
 * 'Federal Comment' is "No Validation" in DEMOS and is seeded with no rules, so
 * it can never appear here. The Review phase's clearance-conditional dates are
 * applied only to applications carrying that clearance level, matching the
 * server's runtime branch rather than over-reporting every application.
 */
DO $do$
BEGIN
  IF to_regclass('demos_app.application_phase') IS NULL OR to_regclass('demos_app.application_date') IS NULL OR to_regclass('migration.phase_completion_rule') IS NULL THEN
    RETURN;
  END IF;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_phantom_phase AS
    WITH completed AS (
      SELECT ap.application_id, ap.phase_id
      FROM demos_app.application_phase ap
      WHERE ap.phase_status_id = 'Completed'
    ),
    -- Clearance lives on the concrete application subtype, not on application.
    clearance AS (
      SELECT d.id AS application_id, d.clearance_level_id FROM demos_app.demonstration d
      UNION ALL
      SELECT a.id, a.clearance_level_id FROM demos_app.amendment a
      UNION ALL
      SELECT e.id, e.clearance_level_id FROM demos_app.extension e
    ),
    applicable AS (
      SELECT
        c.application_id,
        c.phase_id,
        r.requirement_kind,
        r.requirement_id
      FROM completed c
      JOIN migration.phase_completion_rule r ON r.phase_id = c.phase_id
      LEFT JOIN clearance cl ON cl.application_id = c.application_id
      WHERE r.requirement_kind IN ('date', 'document', 'phase')
         OR (r.requirement_kind = 'date_if_osora' AND cl.clearance_level_id = 'CMS (OSORA)')
         OR (r.requirement_kind = 'date_if_comms' AND cl.clearance_level_id = 'COMMs')
    )
    SELECT
      a.application_id                                       AS application_id,
      a.phase_id                                             AS phase_id,
      CASE
        WHEN a.requirement_kind LIKE 'date%' THEN 'date'
        ELSE a.requirement_kind
      END                                                    AS unmet_kind,
      a.requirement_id                                       AS unmet_requirement,
      (a.requirement_kind IN ('date_if_osora', 'date_if_comms'))
                                                             AS is_clearance_conditional
    FROM applicable a
    WHERE
      CASE a.requirement_kind
        WHEN 'document' THEN NOT EXISTS (
          SELECT 1 FROM demos_app.document doc
          WHERE doc.application_id = a.application_id
            AND doc.document_type_id = a.requirement_id
        )
        WHEN 'phase' THEN NOT EXISTS (
          SELECT 1 FROM demos_app.application_phase pp
          WHERE pp.application_id = a.application_id
            AND pp.phase_id = a.requirement_id
            AND pp.phase_status_id = 'Completed'
        )
        ELSE NOT EXISTS (
          SELECT 1 FROM demos_app.application_date ad
          WHERE ad.application_id = a.application_id
            AND ad.date_type_id = a.requirement_id
            AND ad.date_value IS NOT NULL
        )
      END;
  $v$;
  EXECUTE $v$
    CREATE OR REPLACE VIEW migration._parity_phantom_phase_summary AS
    SELECT
      p.phase_id                                   AS phase_id,
      p.unmet_kind                                 AS unmet_kind,
      count(*)                                     AS unmet_requirement_count,
      count(DISTINCT p.application_id)             AS application_count
    FROM migration._parity_phantom_phase p
    GROUP BY p.phase_id, p.unmet_kind;
  $v$;
END
$do$;

