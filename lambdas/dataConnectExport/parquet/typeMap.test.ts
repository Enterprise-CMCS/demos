import { describe, expect, it } from "vitest";

import type { RelationSchema } from "../types";
import {
  copyColumnList,
  csvColumnSpec,
  quoteIdentifier,
  quoteLiteral,
} from "./typeMap";

describe("identifier quoting", () => {
  it("wraps a plain identifier", () => {
    expect(quoteIdentifier("created_at")).toBe('"created_at"');
  });

  it("doubles an embedded quote", () => {
    expect(quoteIdentifier('odd"name')).toBe('"odd""name"');
  });

  it("doubles every quote, not just the first", () => {
    expect(quoteIdentifier('a"b"c')).toBe('"a""b""c"');
  });

  it("survives an identifier that is only quotes", () => {
    expect(quoteIdentifier('""')).toBe('""""""');
  });
});

describe("literal quoting", () => {
  it("wraps a plain value", () => {
    expect(quoteLiteral("/tmp/state.csv")).toBe("'/tmp/state.csv'");
  });

  it("doubles an embedded single quote, which would otherwise end the literal", () => {
    expect(quoteLiteral("it's")).toBe("'it''s'");
  });

  it("doubles every quote, not just the first", () => {
    expect(quoteLiteral("a'b'c")).toBe("'a''b''c'");
  });
});

describe("the SQL fragment builders", () => {
  const schema: RelationSchema = {
    columns: [
      { name: "id", duckdbType: "BIGINT" },
      { name: 'odd"name', duckdbType: "DECIMAL(18,2)" },
    ],
  };

  it("names every column for the server-side copy and casts none of them", () => {
    // COPY renders each value with the type's own output function, so a cast here would add
    // nothing. It would also rename the column, and the CSV has no header to correct it.
    expect(copyColumnList(schema)).toBe('"id", "odd""name"');
    expect(copyColumnList(schema)).not.toContain("::");
  });

  it("declares each column's read_csv type under its own name", () => {
    expect(csvColumnSpec(schema)).toBe("{'id': 'BIGINT', 'odd\"name': 'DECIMAL(18,2)'}");
  });

  it("keeps both fragments in the same order, since the CSV has no header", () => {
    // Column identity is positional. If these two ever disagreed, every value would be
    // written under a neighbouring column's name and type.
    const wide: RelationSchema = {
      columns: [
        { name: "c", duckdbType: "DATE" },
        { name: "a", duckdbType: "UUID" },
        { name: "b", duckdbType: "JSON" },
      ],
    };
    expect(copyColumnList(wide)).toBe('"c", "a", "b"');
    expect(csvColumnSpec(wide)).toBe("{'c': 'DATE', 'a': 'UUID', 'b': 'JSON'}");
  });

  it("escapes a single quote in a column name", () => {
    const odd: RelationSchema = { columns: [{ name: "it's", duckdbType: "VARCHAR" }] };
    expect(csvColumnSpec(odd)).toBe("{'it''s': 'VARCHAR'}");
  });

  it("emits no separator for a single column", () => {
    const single: RelationSchema = { columns: [{ name: "id", duckdbType: "BIGINT" }] };
    expect(copyColumnList(single)).toBe('"id"');
    expect(csvColumnSpec(single)).toBe("{'id': 'BIGINT'}");
  });
});
