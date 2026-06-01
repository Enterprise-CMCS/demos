import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const functionsSql = readFileSync(path.resolve(currentDir, "functions.sql"), "utf8");

function extractRoutine(name: string) {
  const start = functionsSql.indexOf(name);
  expect(start).toBeGreaterThanOrEqual(0);

  const end = functionsSql.indexOf("$$;", start);
  expect(end).toBeGreaterThanOrEqual(0);

  return functionsSql.slice(start, end);
}

function parseColumns(columns: string) {
  return columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
}

function expectPendingMoveCopiesDeliverableMetadata(routineSql: string, destinationTable: string) {
  const insertSelectMatch = new RegExp(
    `INSERT INTO demos_app\\.${destinationTable} \\(([\\s\\S]*?)\\)\\s+SELECT\\s+([\\s\\S]*?)\\s+FROM\\s+demos_app\\.document_pending_upload`
  ).exec(routineSql);

  expect(insertSelectMatch).not.toBeNull();

  const insertColumns = parseColumns(insertSelectMatch![1]);
  const selectColumns = parseColumns(insertSelectMatch![2]);

  for (const column of [
    "deliverable_id",
    "deliverable_type_id",
    "deliverable_is_cms_attached_file",
  ]) {
    const insertIndex = insertColumns.indexOf(column);

    expect(insertIndex).toBeGreaterThanOrEqual(0);
    expect(selectColumns[insertIndex]).toBe(column);
  }
}

describe("functions.sql document pending upload moves", () => {
  it("copies deliverable metadata when moving a pending upload to document", () => {
    expectPendingMoveCopiesDeliverableMetadata(
      extractRoutine("move_document_from_pending_to_clean"),
      "document"
    );
  });

  it("copies deliverable metadata when moving a pending upload to document_infected", () => {
    expectPendingMoveCopiesDeliverableMetadata(
      extractRoutine("move_document_from_pending_to_infected"),
      "document_infected"
    );
  });
});
