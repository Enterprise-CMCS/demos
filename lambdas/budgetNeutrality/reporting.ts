import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

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

export async function replaceNetVarianceReportingSnapshot(
  client: PoolClient,
  workbookId: string,
  netVarianceTotal: number,
): Promise<void> {
  if (!Number.isFinite(netVarianceTotal)) {
    throw new Error("A finite net-variance value is required to persist the reporting snapshot.");
  }

  await clearBudgetNeutralityReportingSnapshot(client, workbookId);
  const timestamp = new Date();
  await insertRows(
    client,
    "budget_neutrality_workbook_hypothetical_value",
    ["id", "workbook_id", "hypothetical_id", "measure_id", "meg_name", "dy_number", "value", "created_at", "updated_at"],
    [[randomUUID(), workbookId, "Main", "Net Variance", null, null, netVarianceTotal, timestamp, timestamp]],
  );
}
