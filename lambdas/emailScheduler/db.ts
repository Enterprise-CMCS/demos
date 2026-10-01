import { Pool } from "pg";
import { log } from "./log";
import { getDatabaseConfig } from "demos-shared-library/database";

export const DB_SCHEMA = "demos_app";

let poolPromise: Promise<Pool> | null = null;

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const dbConfig = await getDatabaseConfig(process.env.DATABASE_SECRET_ARN, {max: 2});
    log.info("connecting to database for emailScheduler");
    return new Pool(dbConfig);
  })();

  return poolPromise;
}
