import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { log } from "./log";
import { region } from "./uipathClient";

const dbSchema = "demos_app";

const secretsManagerClient = new SecretsManagerClient({
  region,
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

let poolPromise: Promise<Pool> | null = null;
let databaseUrlCache = "";
let cacheExpiration = 0;

// Test helper to keep module-scoped cache isolated across unit tests.
export function __resetDbStateForTests(): void {
  poolPromise = null;
  databaseUrlCache = "";
  cacheExpiration = 0;
}

export async function getDatabaseUrl() {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const databaseSecretArn = process.env.DATABASE_SECRET_ARN;
  if (!databaseSecretArn) {
    throw new Error("DATABASE_SECRET_ARN is required to fetch the database connection string.");
  }

  const getDbSecretValueCommand = new GetSecretValueCommand({ SecretId: databaseSecretArn });
  const response = await secretsManagerClient.send(getDbSecretValueCommand);

  if (!response.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${databaseSecretArn}`);
  }

  const dbCredentials = JSON.parse(response.SecretString);
  const sslMode = process.env.DB_SSL_MODE ?? "require"; // can be overwritten, but works locally.
  databaseUrlCache = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${dbCredentials.host}:${dbCredentials.port}/${dbCredentials.dbname}?schema=${dbSchema}&sslmode=${sslMode}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
}

export function getDbSchema() {
  return dbSchema;
}

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const connectionString = await getDatabaseUrl();
    log.info("Connecting to database for UiPath results");
    return new Pool({ connectionString, max: 2 });
  })();

  return poolPromise;
}
