import { describe, expect, it } from "vitest";

import { EXPORT_DATASETS } from "./allowlist";

const relations = Object.keys(EXPORT_DATASETS);
const everyColumn = Object.values(EXPORT_DATASETS).flatMap((columns) => [...columns]);

describe("EXPORT_DATASETS", () => {
  // Pinned in full and on purpose. Publishing a new column should fail this test, so the
  // diff that widens the egress boundary also has to change a file named like a contract.
  it("is exactly the reviewed set of relations and columns", () => {
    expect(EXPORT_DATASETS).toEqual({
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
      ],
      state: ["id", "name", "region"],
    });
  });

  it("excludes any table.column DataConnect does not want to export", () => {
    // If DataConnect wants CHIP ID and medicaid ID exported, 
    // add to the allowlist and remove this test. 
    // Treat this test as a table- and column-level denylist.
    expect(EXPORT_DATASETS.demonstration).not.toContain("medicaid_id");
    expect(EXPORT_DATASETS.demonstration).not.toContain("chip_id");
  });

  it("names no relation that the demos_read grant exposes but the export must not publish", () => {
    // demos_export inherits demos_read, which can SELECT all of demos_app. Nothing but
    // this constant stops these tables being exported.
    const offLimits = ["person", "users", "user_session", "private_comment", "document"];
    for (const table of offLimits) {
      expect(relations).not.toContain(table);
    }
  });

  it("names no column that looks like free text or a direct identifier", () => {
    // A pattern check rather than a list, so a column added later is caught even though
    // this test was written before it existed. description is expected and allowed.
    const risky = /ssn|social|email|phone|dob|birth|address|password|secret|token|comment|note/i;
    const flagged = everyColumn.filter((column) => risky.test(column));
    expect(flagged).toEqual([]);
  });

  it("lists every column at most once per relation", () => {
    // A duplicate would produce two identically named parquet columns and an
    // ambiguous read on the consumer side.
    for (const [relation, columns] of Object.entries(EXPORT_DATASETS)) {
      expect(new Set(columns).size, `${relation} has a duplicate column`).toBe(columns.length);
    }
  });

  it("uses snake_case identifiers that need no quoting to be correct", () => {
    // Quoting is applied anyway, but a column with a quote or a space in it would mean
    // the allowlist no longer matches what information_schema reports.
    for (const column of everyColumn) {
      expect(column).toMatch(/^[a-z][a-z0-9_]*$/);
    }
    for (const relation of relations) {
      expect(relation).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("gives every relation at least one column", () => {
    // An empty relation would produce a parquet file with no columns, which is not a valid
    // parquet file and would fail the upload.
    for (const [relation, columns] of Object.entries(EXPORT_DATASETS)) {
      expect(columns.length, `${relation} has no columns`).toBeGreaterThan(0);
    }
  });
});
