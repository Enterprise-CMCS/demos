import { Pool } from "pg";
import { readFileSync } from "node:fs";

import { log } from "./log";
import { getDatabaseConfig } from "demos-shared-library/database";

const dbSchema = "demos_app";

let poolPromise: Promise<Pool> | null = null;

// Test helper to keep module-scoped cache isolated across unit tests.
export function __resetDbStateForTests(): void {
  poolPromise = null;
}

export function getDbSchema() {
  return dbSchema;
}

const certPath = process.env.DB_SSL_ROOT_CERT;
const caCert = certPath ? readFileSync(certPath, "utf8") : undefined;

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const dbConfig = await getDatabaseConfig(process.env.DATABASE_SECRET_ARN, {max: 2, ssl: {ca: caCert}});
    log.info("Connecting to database for email notification status updates");
    return new Pool(dbConfig);
  })();

  return poolPromise;
}
