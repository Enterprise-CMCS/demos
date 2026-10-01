import { Pool } from "pg";

import { log } from "./log";
import { getDatabaseConfig } from "demos-shared-library/database";

const dbSchema = "demos_app";

let poolPromise: Promise<Pool> | null = null;
let databaseUrlCache = "";
let cacheExpiration = 0;

// Test helper to keep module-scoped cache isolated across unit tests.
export function __resetDbStateForTests(): void {
  poolPromise = null;
  databaseUrlCache = "";
  cacheExpiration = 0;
}

export function getDbSchema() {
  return dbSchema;
}

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const dbConfig = await getDatabaseConfig(process.env.DATABASE_SECRET_ARN, {max: 2, ssl: {ca: process.env.DB_SSL_ROOT_CERT}});
    log.info("Connecting to database for email notification status updates");
    return new Pool(dbConfig);
  })();

  return poolPromise;
}
