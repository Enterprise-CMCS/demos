import { Pool } from "pg";
import { log } from "../log";
import { getDatabaseConfig } from "demos-shared-library/database";

export const dbSchema = "demos_app";

// The export streams every column out with COPY ... TO STDOUT WITH (FORMAT csv), which makes
// Postgres output formatting part of the data path. A server configured with a non-ISO DateStyle
// renders a date as 31.08.2026, which DuckDB refuses to read as a DATE, so the export would fail
// rather than inherit the setting silently. Pinning these on the startup packet keeps the text
// form independent of server configuration.
const sessionOptions = "-c DateStyle=ISO,MDY -c TimeZone=UTC";

let poolPromise: Promise<Pool> | null = null;

// Test helper to keep module-scoped cache isolated across unit tests.
export function __resetDbStateForTests(): void {
  poolPromise = null;
}

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const config = await getDatabaseConfig(process.env.DATABASE_SECRET_ARN, {max: 2, options: sessionOptions});
    log.info("Connecting to database for DataConnect data export");
    return new Pool(config);
  })();

  return poolPromise;
}
