import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Pool, type PoolConfig } from "pg";
import { log } from "../log";

export const dbSchema = "demos_app";

// The export streams every column out with COPY ... TO STDOUT WITH (FORMAT csv), which makes
// Postgres output formatting part of the data path. A server configured with a non-ISO DateStyle
// renders a date as 31.08.2026, which DuckDB refuses to read as a DATE, so the export would fail
// rather than inherit the setting silently. Pinning these on the startup packet keeps the text
// form independent of server configuration.
const sessionOptions = "-c DateStyle=ISO,MDY -c TimeZone=UTC";

const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

let poolPromise: Promise<Pool> | null = null;
let databaseConfigCache: PoolConfig | null = null;
let cacheExpiration = 0;

// Test helper to keep module-scoped cache isolated across unit tests.
export function __resetDbStateForTests(): void {
  poolPromise = null;
  databaseConfigCache = null;
  cacheExpiration = 0;
}

export async function getDatabaseConfig(): Promise<PoolConfig> {
  const now = Date.now();
  if (databaseConfigCache && cacheExpiration > now) {
    return databaseConfigCache;
  }

  const databaseSecretArn = process.env.DATABASE_SECRET_ARN;
  if (!databaseSecretArn) {
    throw new Error("DATABASE_SECRET_ARN is required to fetch the database configuration.");
  }

  const getDbSecretValueCommand = new GetSecretValueCommand({ SecretId: databaseSecretArn });
  const response = await secretsManagerClient.send(getDbSecretValueCommand);

  if (!response.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${databaseSecretArn}`);
  }

  const dbCredentials = JSON.parse(response.SecretString);
  const sslMode =
    process.env.DB_SSL_MODE ?? (process.env.BYPASS_SSL ? "disable" : "require");

  databaseConfigCache = {
    user: dbCredentials.username,
    host: dbCredentials.host,
    port: dbCredentials.port,
    database: dbCredentials.dbname,
    ssl:
      sslMode === "disable"
        ? false
        : sslMode === "no-verify"
          ? { rejectUnauthorized: false }
          : {},
    max: 2,
    options: sessionOptions,
  };
  Object.defineProperty(databaseConfigCache, "password", {
    enumerable: false,
    value: dbCredentials.password,
  });
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseConfigCache;
}

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const config = await getDatabaseConfig();
    log.info("Connecting to database for DataConnect data export");
    return new Pool(config);
  })();

  return poolPromise;
}