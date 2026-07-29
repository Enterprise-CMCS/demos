/*
 * Purpose: Define and seed migration.phase_completion_rule, a SQL transcription of the DEMOS server's phase-completion validation table, so migration can quantify how many phases it stamped 'Completed' would fail that validation if DEMOS re-ran it; migration-private reference data; idempotent.
 * Refs:    server/src/model/applicationPhase/checkPhaseCompletionRules.ts, sql/99_parity/61_phantom_phase.sql, docs/specs/api-validation-migration-audit-spec.md
 *
 * DEMOS gates a phase transition to 'Completed' behind
 * checkPhaseCompletionRules(): the application must carry every date in
 * datesMustExist, hold a document of every type in documentTypesMustExist, and
 * have every phase in phasesMustBeComplete already Completed. That gate lives
 * on the GraphQL mutation path only -- it is application code, not a database
 * constraint -- so a bulk INSERT of application_phase rows bypasses it
 * completely.
 *
 * The migration derives phase status from legacy PMDA status codes
 * (sql/23_app_derived/50_application_phase.sql), not from evidence that the
 * work products exist. It therefore stamps 'Completed' on phases whose
 * requirements are demonstrably unmet -- "phantom" completions. They do not
 * break the load and DEMOS never re-validates an existing row, but a user who
 * later reopens and re-completes such a phase WILL hit the gate. This seed
 * exists so that population can be counted instead of estimated.
 *
 * SOURCE OF TRUTH IS THE TYPESCRIPT, NOT THIS FILE. This is a transcription and
 * can drift the moment the server changes a rule. tests/test_phase_completion_rule_drift.py
 * re-parses checkPhaseCompletionRules.ts on every run and fails if the two
 * disagree, so the drift is caught rather than silently reported as fact.
 *
 * Two deliberate omissions:
 *   - 'Federal Comment' is "No Validation" in the server table, so it is seeded
 *     with no rules at all and can never be phantom.
 *   - The Review phase's clearance-conditional dates (CMS_OSORA_CLEARANCE_DATE_TYPES,
 *     COMMS_CLEARANCE_DATE_TYPES, appended only when the application carries that
 *     clearance level) are seeded as 'date_if_osora' / 'date_if_comms' so the
 *     parity view can apply them conditionally rather than over-reporting.
 */
CREATE TABLE IF NOT EXISTS migration.phase_completion_rule(
  phase_id text NOT NULL,
  requirement_kind text NOT NULL,
  requirement_id text NOT NULL,
  PRIMARY KEY (phase_id, requirement_kind, requirement_id),
  CONSTRAINT phase_completion_rule_kind_chk CHECK (requirement_kind IN ('date', 'date_if_osora', 'date_if_comms', 'document', 'phase'))
);

TRUNCATE migration.phase_completion_rule;

INSERT INTO migration.phase_completion_rule(phase_id, requirement_kind, requirement_id)
VALUES
  ('Concept', 'date', 'Concept Paper Submitted Date'),
('Concept', 'document', 'Pre-Submission'),
('Application Intake', 'date', 'State Application Submitted Date'),
('Application Intake', 'date', 'Completeness Review Due Date'),
('Application Intake', 'document', 'State Application'),
('Completeness', 'date', 'State Application Deemed Complete'),
('Completeness', 'date', 'Federal Comment Period Start Date'),
('Completeness', 'date', 'Federal Comment Period End Date'),
('Completeness', 'document', 'Application Completeness Letter'),
('Completeness', 'document', 'Internal Completeness Review Form'),
('Completeness', 'phase', 'Application Intake'),
  -- 'Federal Comment' is "No Validation": intentionally no rows.
('SDG Preparation', 'date', 'Expected Approval Date'),
('SDG Preparation', 'date', 'SME Initial Review Date'),
('SDG Preparation', 'date', 'FRT Initial Meeting Date'),
('SDG Preparation', 'date', 'BNPMT Initial Meeting Date'),
('SDG Preparation', 'phase', 'Application Intake'),
('SDG Preparation', 'phase', 'Completeness'),
('SDG Preparation', 'phase', 'Federal Comment'),
('Review', 'date', 'OGD Approval to Share with SMEs'),
('Review', 'date', 'Draft Approval Package to Prep'),
('Review', 'date', 'DDME Approval Received'),
('Review', 'date', 'State Concurrence'),
('Review', 'date', 'BN PMT Approval to Send to OMB'),
('Review', 'date', 'Draft Approval Package Shared'),
('Review', 'date', 'Receive OMB Concurrence'),
('Review', 'date', 'Receive OGC Legal Clearance'),
('Review', 'date_if_osora', 'Submit Approval Package to OSORA'),
('Review', 'date_if_osora', 'OSORA R1 Comments Due'),
('Review', 'date_if_osora', 'OSORA R2 Comments Due'),
('Review', 'date_if_osora', 'CMS (OSORA) Clearance End'),
('Review', 'date_if_comms', 'Package Sent for COMMs Clearance'),
('Review', 'date_if_comms', 'COMMs Clearance Received'),
('Review', 'phase', 'Application Intake'),
('Review', 'phase', 'Completeness'),
('Review', 'phase', 'Federal Comment'),
('Review', 'phase', 'SDG Preparation'),
('Approval Package', 'document', 'Approval Letter'),
('Approval Package', 'document', 'Final Budget Neutrality Formulation Workbook'),
('Approval Package', 'document', 'Formal OMB Policy Concurrence Email'),
('Approval Package', 'document', 'Special Terms & Conditions'),
('Approval Package', 'document', 'Q&A'),
('Approval Package', 'document', 'Signed Decision Memo'),
('Approval Package', 'phase', 'Application Intake'),
('Approval Package', 'phase', 'Completeness'),
('Approval Package', 'phase', 'Federal Comment'),
('Approval Package', 'phase', 'SDG Preparation'),
('Approval Package', 'phase', 'Review'),
('Approval Summary', 'date', 'Application Details Marked Complete Date'),
('Approval Summary', 'date', 'Application Demonstration Types Marked Complete Date'),
('Approval Summary', 'date', 'Application Approval Date'),
('Approval Summary', 'phase', 'Application Intake'),
('Approval Summary', 'phase', 'Completeness'),
('Approval Summary', 'phase', 'Federal Comment'),
('Approval Summary', 'phase', 'SDG Preparation'),
('Approval Summary', 'phase', 'Review'),
('Approval Summary', 'phase', 'Approval Package');

