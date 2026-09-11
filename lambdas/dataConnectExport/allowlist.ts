import type { RelationSchema } from "./types";

/**
 * The export egress boundary. Every column that leaves the platform is named here.
 *
 * The demos_export role inherits demos_read, which can SELECT every table in
 * demos_app including PII tables (person, user, user_session, private_comment).
 * This constant, reviewed in a PR, is the only thing limiting what is published.
 * Do not move it to SSM or an environment variable.
 */
export const EXPORT_DATASETS = {
  demonstration: {
    columns: [
      { name: "id", duckdbType: "UUID" },
      { name: "application_type_id", duckdbType: "VARCHAR" },
      { name: "name", duckdbType: "VARCHAR" },
      { name: "description", duckdbType: "VARCHAR" },
      { name: "effective_date", duckdbType: "TIMESTAMPTZ" },
      { name: "expiration_date", duckdbType: "TIMESTAMPTZ" },
      { name: "status_id", duckdbType: "VARCHAR" },
      { name: "status_updated_at", duckdbType: "TIMESTAMPTZ" },
      { name: "state_id", duckdbType: "VARCHAR" },
      { name: "sdg_division_id", duckdbType: "VARCHAR" },
      { name: "signature_level_id", duckdbType: "VARCHAR" },
      { name: "clearance_level_id", duckdbType: "VARCHAR" },
      { name: "current_phase_id", duckdbType: "VARCHAR" },
      { name: "created_at", duckdbType: "TIMESTAMPTZ" },
      { name: "updated_at", duckdbType: "TIMESTAMPTZ" },
    ],
  }, // deliberately excluding chip_id and medicaid_id for now
  state: {
    columns: [
      { name: "id", duckdbType: "VARCHAR" },
      { name: "name", duckdbType: "VARCHAR" },
      { name: "region", duckdbType: "INTEGER" },
    ],
  },
} as const satisfies Record<string, RelationSchema>;
