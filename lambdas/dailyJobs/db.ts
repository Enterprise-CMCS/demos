import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";

import { log } from "./log";

const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

let poolPromise: Promise<Pool> | null = null;
let databaseUrlCache = "";
let cacheExpiration = 0;

export function __resetDbStateForTests(): void {
  poolPromise = null;
  databaseUrlCache = "";
  cacheExpiration = 0;
}

export function getDbSchema(): string {
  const schema = process.env.DB_SCHEMA ?? "demos_app";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error(`Invalid DB_SCHEMA: ${schema}`);
  }
  return schema;
}

export async function getDatabaseUrl(): Promise<string> {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const databaseSecretArn = process.env.DATABASE_SECRET_ARN;
  if (!databaseSecretArn) {
    throw new Error("DATABASE_SECRET_ARN is required to fetch the database connection string.");
  }

  const response = await secretsManagerClient.send(
    new GetSecretValueCommand({ SecretId: databaseSecretArn })
  );
  if (!response.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${databaseSecretArn}`);
  }

  const credentials = JSON.parse(response.SecretString);
  const sslMode = process.env.DB_SSL_MODE ?? "require";
  const schema = getDbSchema();
  const username = encodeURIComponent(credentials.username);
  const password = encodeURIComponent(credentials.password);

  databaseUrlCache =
    `postgresql://${username}:${password}` +
    `@${credentials.host}:${credentials.port}/${credentials.dbname}` +
    `?schema=${schema}&sslmode=${sslMode}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
}

export async function getDbPool(): Promise<Pool> {
  poolPromise ??= (async () => {
    const connectionString = await getDatabaseUrl();
    log.info("Connecting Daily Jobs to the database");
    return new Pool({ connectionString, max: 2 });
  })();

  return poolPromise;
}
