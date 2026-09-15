import { describe, expect, it } from "vitest";

import { EXPORT_DATASETS } from "./allowlist";
import type { RelationColumn } from "./types";

const relations = Object.keys(EXPORT_DATASETS);
const everyColumn = Object.values(EXPORT_DATASETS).flatMap<RelationColumn>(
  (schema) => schema.columns
);
const everyColumnName = everyColumn.map(({ name }) => name);

describe("EXPORT_DATASETS", () => {
  it("pins the reviewed relations, columns, order and parquet types", () => {
    expect(EXPORT_DATASETS).toEqual({
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
      },
      state: {
        columns: [
          { name: "id", duckdbType: "VARCHAR" },
          { name: "name", duckdbType: "VARCHAR" },
          { name: "region", duckdbType: "INTEGER" },
        ],
      },
    });
  });

  it("excludes any table.column DataConnect does not want to export", () => {
    // If DataConnect wants CHIP ID and Medicaid ID exported,
    // add them to the allowlist and remove this test.
    // Treat this test as a table- and column-level denylist.
    const demonstrationColumns = EXPORT_DATASETS.demonstration.columns.map(({ name }) => name);
    expect(demonstrationColumns).not.toContain("medicaid_id");
    expect(demonstrationColumns).not.toContain("chip_id");
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
    const flagged = everyColumnName.filter((column) => risky.test(column));
    expect(flagged).toEqual([]);
  });

  it("lists every column at most once per relation", () => {
    for (const [relation, schema] of Object.entries(EXPORT_DATASETS)) {
      const names = schema.columns.map(({ name }) => name);
      expect(new Set(names).size, `${relation} has a duplicate column`).toBe(names.length);
    }
  });

  it("uses snake_case identifiers that need no quoting to be correct", () => {
    for (const column of everyColumnName) {
      expect(column).toMatch(/^[a-z][a-z0-9_]*$/);
    }
    for (const relation of relations) {
      expect(relation).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("gives every relation at least one column", () => {
    for (const [relation, schema] of Object.entries(EXPORT_DATASETS)) {
      expect(schema.columns.length, `${relation} has no columns`).toBeGreaterThan(0);
    }
  });
});
