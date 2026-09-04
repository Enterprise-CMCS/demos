/**
 * The export egress boundary. Every column that leaves the platform is named here.
 *
 * The demos_export role inherits demos_read, which can SELECT every table in
 * demos_app including PII tables (person, user, user_session, private_comment).
 * This constant, reviewed in a PR, is the only thing limiting what is published.
 * Do not move it to SSM or an environment variable.
 */
export const EXPORT_DATASETS = {
  demonstration: [
    "id",
    "application_type_id",
    "name",
    "description",
    "effective_date",
    "expiration_date",
    "status_id",
    "status_updated_at",
    "state_id",
    "sdg_division_id",
    "signature_level_id",
    "clearance_level_id",
    "current_phase_id",
    "created_at",
    "updated_at",
  ], // deliberately excluding chip_id and medicaid_id for now
  state: ["id", "name", "region"],
} as const satisfies Record<string, readonly string[]>;
