import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { EXPORT_VIEWS, latestLabelledDate } from "./views";

function reportColumns(report: string): string[] {
  const path = new URL(`../../server/src/onDemandReports/configs/${report}ReportConfig.ts`, import.meta.url);
  const source = ts.createSourceFile(fileURLToPath(path), readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
  const alias = source.statements.find((statement): statement is ts.TypeAliasDeclaration =>
    ts.isTypeAliasDeclaration(statement) && statement.name.text.endsWith("ReportColumn"));
  if (!alias) throw new Error(`Missing *ReportColumn type alias in ${report}ReportConfig.ts`);
  const members: readonly ts.TypeNode[] = ts.isUnionTypeNode(alias.type) ? alias.type.types : [alias.type];
  return members.map((member) => {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) {
      throw new Error(`${alias.name.text} must be a union of string literals`);
    }
    return member.literal.text;
  });
}

describe("demonstration reporting contract", () => {
  it("matches the overview report columns and types", () => {
    const columns = EXPORT_VIEWS.demonstration_reporting.schema.columns;
    expect(columns.map((column) => column.name)).toEqual([
      "demonstration_id", ...reportColumns("demonstrationOverview"),
      "applications", "deliverables", "demonstration_types",
    ]);
    for (const column of columns) {
      expect(column.duckdbType).toBe(column.name === "demonstration_id" ? "UUID"
        : column.name === "approved_amendment_applications" ? "INTEGER"
        : ["applications", "deliverables", "demonstration_types"].includes(column.name) ? "JSON" : "VARCHAR");
    }
  });

  it("exports every application field in report order", () => {
    const fields = EXPORT_VIEWS.demonstration_reporting.collectionSchemas.applications.columns;
    expect(fields.map((field) => field.name)).toEqual(reportColumns("applicationDetails"));
    expect(fields.every((field) => field.duckdbType === "VARCHAR")).toBe(true);
  });

  it.each([
    ["deliverables", "deliverableStatus"],
    ["demonstration_types", "demonstrationTypes"],
  ])("exports the complete %s report shape", (collection, report) => {
    const schemas = EXPORT_VIEWS.demonstration_reporting.collectionSchemas;
    const fields = schemas[collection as keyof typeof schemas].columns;
    const expectedFields = reportColumns(report);
    if (collection === "deliverables") expectedFields.push("budget_neutrality_reporting");
    expect(fields.map((field) => field.name)).toEqual(expectedFields);
    for (const field of fields) {
      expect(field.duckdbType).toBe(field.name === "budget_neutrality_reporting" ? "JSON"
        : ["total_extensions_requested", "total_resubmissions_requested"].includes(field.name) ? "INTEGER" : "VARCHAR");
    }
  });

  it("exports the latest successful workbook's reporting rows without changing deliverable counts", () => {
    const view = EXPORT_VIEWS.demonstration_reporting;
    const reporting = view.collectionSchemas.deliverables.columns.find(
      (field) => field.name === "budget_neutrality_reporting"
    );

    expect(reporting?.duckdbType).toBe("JSON");
    expect(view.query).toContain("DISTINCT ON (doc.deliverable_id)");
    expect(view.query).toContain("ORDER BY doc.deliverable_id, da.action_timestamp DESC, bn.id DESC");
    expect(view.query).toContain("'workbook_id', most_recent_valid_bn_data.workbook_id");
    expect(view.query).toContain("'test_values'");
    expect(view.query).toContain("COALESCE(bn_value_aggregates.test_values, '[]'::json)");
    expect(view.query).toContain("'test_years'");
    expect(view.query).toContain("COALESCE(bn_year_aggregates.test_years, '[]'::json)");
    expect(view.query).toContain("'cap_needed', cap_needed");
    expect(view.query).toContain("ORDER BY CASE WHEN hypothetical_id = 'Main' THEN 0 ELSE substring(hypothetical_id FROM '[0-9]+')::INTEGER END,\n            measure_id");
    expect(view.query).toContain("ORDER BY CASE WHEN hypothetical_id = 'Main' THEN 0 ELSE substring(hypothetical_id FROM '[0-9]+')::INTEGER END,\n            dy_number");
    expect(view.query).toContain("WHEN most_recent_valid_bn_data.workbook_id IS NULL THEN NULL");
    expect(view.query).toContain("json_agg(json_build_object(");
    expect(view.baseTables).toContain("budget_neutrality_workbook_hypothetical_value");
    expect(view.baseTables).toContain("budget_neutrality_workbook_hypothetical_year");
    expect(view.query.match(/FROM demos_app\.deliverable AS deliv/g)).toHaveLength(1);
  });

  it("declares every demos_app table the query reads, for snapshot locking", () => {
    const { query, baseTables } = EXPORT_VIEWS.demonstration_reporting;
    const sources = [...query.matchAll(/\bdemos_app\.([a-z_]+)/g)].map((match) => match[1]);
    expect([...new Set(baseTables)].sort()).toEqual([...new Set(sources)].sort());
  });

  it("escapes date and document labels as SQL string literals", () => {
    expect(latestLabelledDate("obrien_date", "date_type_id", "O'Brien Date", "date_value"))
      .toContain("CASE WHEN date_type_id = 'O''Brien Date' THEN date_value END");
  });
});
