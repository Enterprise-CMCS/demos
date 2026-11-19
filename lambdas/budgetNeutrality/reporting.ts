import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
<<<<<<< HEAD
import type { BNWorkbookExtract } from "demos-shared-library/BN/extractors";
=======
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b

const DB_SCHEMA = "demos_app";
const MAX_INSERT_PARAMETERS = 60_000;
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;

const DELETE_REPORTING_CHILDREN_SQL = [
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_hypothetical_value WHERE workbook_id = $1::UUID;`,
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_hypothetical_year WHERE workbook_id = $1::UUID;`,
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_spending_limit_meg WHERE workbook_id = $1::UUID;`,
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_spending_limit WHERE workbook_id = $1::UUID;`,
];

export async function insertRows(
  client: PoolClient,
  tableName: string,
  columns: readonly string[],
  rows: readonly (readonly unknown[])[],
): Promise<void> {
  if (!IDENTIFIER_PATTERN.test(tableName) || columns.length === 0 || columns.some((column) => !IDENTIFIER_PATTERN.test(column))) {
    throw new Error("Reporting inserts require valid table and column names.");
  }
  if (rows.some((row) => row.length !== columns.length)) {
    throw new Error("Reporting insert rows must match the column count.");
  }

  const rowsPerBatch = Math.floor(MAX_INSERT_PARAMETERS / columns.length);
<<<<<<< HEAD
  if (rowsPerBatch === 0) {
    throw new Error("Reporting insert columns exceed the parameter limit.");
  }
=======
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
  for (let offset = 0; offset < rows.length; offset += rowsPerBatch) {
    const batch = rows.slice(offset, offset + rowsPerBatch);
    const values: unknown[] = [];
    const valueGroups = batch.map((row) => {
      const placeholders = row.map((value) => {
        values.push(value);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    await client.query(
      `INSERT INTO ${DB_SCHEMA}.${tableName} (${columns.join(", ")}) VALUES ${valueGroups.join(", ")};`,
      values,
    );
  }
}

export async function clearBudgetNeutralityReportingSnapshot(
  client: PoolClient,
  workbookId: string,
): Promise<void> {
  for (const query of DELETE_REPORTING_CHILDREN_SQL) {
    await client.query(query, [workbookId]);
  }
}

<<<<<<< HEAD
export async function replaceBudgetNeutralityReportingSnapshot(
  client: PoolClient,
  workbookId: string,
  extract: BNWorkbookExtract,
): Promise<void> {
  const netVariance = extract.testValues.find(({ testId, measureId }) => testId === "Main" && measureId === "Net Variance");
  if (!Number.isFinite(netVariance?.value) || extract.testValues.some(({ value }) => !Number.isFinite(value))) {
    throw new Error("A finite net-variance value and finite reporting values are required to persist the snapshot.");
=======
export async function replaceNetVarianceReportingSnapshot(
  client: PoolClient,
  workbookId: string,
  netVarianceTotal: number,
): Promise<void> {
  if (!Number.isFinite(netVarianceTotal)) {
    throw new Error("A finite net-variance value is required to persist the reporting snapshot.");
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
  }

  await clearBudgetNeutralityReportingSnapshot(client, workbookId);
  const timestamp = new Date();
<<<<<<< HEAD
  await insertRows(client, "budget_neutrality_workbook_hypothetical_value", [
    "id", "workbook_id", "hypothetical_id", "measure_id", "meg_name", "dy_number", "value", "created_at", "updated_at",
  ], extract.testValues.map(({ testId, measureId, megName, dyNumber, value }) => [
    randomUUID(), workbookId, testId, measureId, megName, dyNumber, value, timestamp, timestamp,
  ]));
  await insertRows(client, "budget_neutrality_workbook_hypothetical_year", [
    "workbook_id", "hypothetical_id", "dy_number", "cap_needed", "created_at", "updated_at",
  ], extract.testYears.map(({ testId, dyNumber, capNeeded }) => [
    workbookId, testId, dyNumber, capNeeded, timestamp, timestamp,
  ]));
=======
  await insertRows(
    client,
    "budget_neutrality_workbook_hypothetical_value",
    ["id", "workbook_id", "hypothetical_id", "measure_id", "meg_name", "dy_number", "value", "created_at", "updated_at"],
    [[randomUUID(), workbookId, "Main", "Net Variance", null, null, netVarianceTotal, timestamp, timestamp]],
  );
>>>>>>> 8d0d22562230370c1b466f00e3978f746428403b
}
