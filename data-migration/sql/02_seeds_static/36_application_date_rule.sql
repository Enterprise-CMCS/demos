/*
 * Purpose: Define and seed migration.date_type_expected_timestamp and migration.application_date_rule, a SQL transcription of the DEMOS server's application-date validation table, so migration can quantify which loaded application_date rows would fail that validation; migration-private reference data; idempotent.
 * Refs:    server/src/model/applicationDate/validateInputDates.ts, server/src/constants.ts, sql/99_parity/60_application_date_consistency.sql
 *
 * DEMOS validates application dates in validateInputDates() on the GraphQL
 * mutation path. Three families of rule apply:
 *
 *   expected timestamp  every date type must land exactly on Eastern
 *                       start-of-day (00:00:00.000) or end-of-day
 *                       (23:59:59.999). DATE_TYPES_WITH_EXPECTED_TIMESTAMPS.
 *   ordering ('gte')    a phase completion date must be >= its start date, and
 *                       "State Application Deemed Complete" >= "State
 *                       Application Submitted Date".
 *   offset              a fixed +/-15, +/-30 or +/-1 day relationship between a
 *                       pair of dates, compared on the Eastern calendar date.
 *
 * Two details of the server implementation drive how the parity view reads this
 * seed, and both are easy to get wrong:
 *
 *   1. An ordering or offset rule whose COUNTERPART date is absent does not
 *      pass -- getDateValueFromApplicationDateMap() throws. So a migrated
 *      application holding one half of a pair is already in violation, even
 *      though nothing about the value it does hold is wrong.
 *   2. Offset comparison is on year/month/day only (doYMDMatch), not on the
 *      instant, so it must be evaluated in America/New_York, not UTC.
 *
 * The offset rules are seeded in BOTH directions because the server declares
 * them that way (A = B+15 and B = A-15 are separate entries that fire on
 * different edits), so a per-date-type report matches what a user would hit.
 *
 * SOURCE OF TRUTH IS THE TYPESCRIPT, NOT THIS FILE.
 * tests/test_application_date_rule_drift.py re-parses validateInputDates.ts and
 * constants.ts on every run and fails if this transcription drifts.
 */
CREATE TABLE IF NOT EXISTS migration.date_type_expected_timestamp(
  date_type_id text PRIMARY KEY,
  expected_timestamp text NOT NULL,
  CONSTRAINT date_type_expected_timestamp_value_chk CHECK (expected_timestamp IN ('Start of Day', 'End of Day'))
);

CREATE TABLE IF NOT EXISTS migration.application_date_rule(
  date_type_id text NOT NULL,
  rule_kind text NOT NULL,
  target_date_type_id text NOT NULL,
  offset_days integer,
  offset_expected_timestamp text,
  PRIMARY KEY (date_type_id, rule_kind, target_date_type_id),
  CONSTRAINT application_date_rule_kind_chk CHECK (rule_kind IN ('gte', 'offset')),
  CONSTRAINT application_date_rule_offset_chk CHECK ((rule_kind = 'offset' AND offset_days IS NOT NULL AND offset_expected_timestamp IS NOT NULL) OR (rule_kind = 'gte' AND offset_days IS NULL AND offset_expected_timestamp IS NULL))
);

TRUNCATE migration.date_type_expected_timestamp;

TRUNCATE migration.application_date_rule;

INSERT INTO migration.date_type_expected_timestamp(date_type_id, expected_timestamp)
VALUES
  ('Concept Start Date', 'Start of Day'),
('Concept Paper Submitted Date', 'Start of Day'),
('Concept Completion Date', 'Start of Day'),
('Concept Skipped Date', 'Start of Day'),
('Application Intake Start Date', 'Start of Day'),
('State Application Submitted Date', 'Start of Day'),
('Completeness Review Due Date', 'End of Day'),
('Application Intake Completion Date', 'Start of Day'),
('Completeness Start Date', 'Start of Day'),
('State Application Deemed Complete', 'Start of Day'),
('Federal Comment Period Start Date', 'Start of Day'),
('Federal Comment Period End Date', 'End of Day'),
('Completeness Completion Date', 'Start of Day'),
('SDG Preparation Start Date', 'Start of Day'),
('Expected Approval Date', 'Start of Day'),
('SME Initial Review Date', 'Start of Day'),
('FRT Initial Meeting Date', 'Start of Day'),
('BNPMT Initial Meeting Date', 'Start of Day'),
('SDG Preparation Completion Date', 'Start of Day'),
('Review Start Date', 'Start of Day'),
('Review Completion Date', 'Start of Day'),
('OGD Approval to Share with SMEs', 'Start of Day'),
('Draft Approval Package to Prep', 'Start of Day'),
('DDME Approval Received', 'Start of Day'),
('State Concurrence', 'Start of Day'),
('BN PMT Approval to Send to OMB', 'Start of Day'),
('Draft Approval Package Shared', 'Start of Day'),
('Receive OMB Concurrence', 'Start of Day'),
('Receive OGC Legal Clearance', 'Start of Day'),
('Approval Package Start Date', 'Start of Day'),
('Approval Package Completion Date', 'Start of Day'),
('COMMs Clearance Received', 'Start of Day'),
('Submit Approval Package to OSORA', 'Start of Day'),
('Package Sent for COMMs Clearance', 'Start of Day'),
('OSORA R1 Comments Due', 'End of Day'),
('OSORA R2 Comments Due', 'End of Day'),
('CMS (OSORA) Clearance End', 'End of Day'),
('Application Details Marked Complete Date', 'Start of Day'),
('Application Demonstration Types Marked Complete Date', 'Start of Day'),
('Approval Summary Start Date', 'Start of Day'),
('Approval Summary Completion Date', 'Start of Day'),
('Application Approval Date', 'Start of Day');

INSERT INTO migration.application_date_rule(date_type_id, rule_kind, target_date_type_id, offset_days, offset_expected_timestamp)
VALUES
  -- Phase completion dates must follow their start dates.
('Concept Completion Date', 'gte', 'Concept Start Date', NULL, NULL),
('Concept Skipped Date', 'gte', 'Concept Start Date', NULL, NULL),
('Application Intake Completion Date', 'gte', 'Application Intake Start Date', NULL, NULL),
('Completeness Completion Date', 'gte', 'Completeness Start Date', NULL, NULL),
('SDG Preparation Completion Date', 'gte', 'SDG Preparation Start Date', NULL, NULL),
('Approval Package Completion Date', 'gte', 'Approval Package Start Date', NULL, NULL),
('Review Completion Date', 'gte', 'Review Start Date', NULL, NULL),
  -- A state application must be deemed complete after it is submitted.
('State Application Deemed Complete', 'gte', 'State Application Submitted Date', NULL, NULL),
  -- Completeness review is due 15 days after the state application is submitted.
('Completeness Review Due Date', 'offset', 'State Application Submitted Date', 15, 'End of Day'),
('State Application Submitted Date', 'offset', 'Completeness Review Due Date', -15, 'Start of Day'),
  -- Federal comment starts 1 day after the application is deemed complete.
('Federal Comment Period Start Date', 'offset', 'State Application Deemed Complete', 1, 'Start of Day'),
('State Application Deemed Complete', 'offset', 'Federal Comment Period Start Date', -1, 'Start of Day'),
  -- The federal comment period is 30 days long.
('Federal Comment Period End Date', 'offset', 'Federal Comment Period Start Date', 30, 'End of Day'),
('Federal Comment Period Start Date', 'offset', 'Federal Comment Period End Date', -30, 'Start of Day');

