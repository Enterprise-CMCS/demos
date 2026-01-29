import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { log } from "./log";

const dbSchema = process.env.DB_SCHEMA || "demos_app";

const secrets = new SecretsManagerClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

let poolPromise: Promise<Pool> | null = null;

let databaseUrlCache = "";
let cacheExpiration = 0;

export async function getDatabaseUrl() {
  const now = Date.now();
  if (databaseUrlCache && cacheExpiration > now) {
    return databaseUrlCache;
  }

  const secretArn = process.env.DATABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error("DATABASE_SECRET_ARN is required to fetch the database connection string.");
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secrets.send(command);

  if (!response.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${secretArn}`);
  }
  const secretData = JSON.parse(response.SecretString);
  const sslMode = process.env.DB_SSL_MODE ?? "require";
  databaseUrlCache = `postgresql://${secretData.username}:${secretData.password}@${secretData.host}:${secretData.port}/${secretData.dbname}?schema=${dbSchema}&sslmode=${sslMode}`;
  cacheExpiration = now + 60 * 60 * 1000;

  return databaseUrlCache;
}

export function getDbSchema() {
  return dbSchema;
}

export async function getDbPool(): Promise<Pool> {
  if (poolPromise === null) {
    poolPromise = (async () => {
      const connectionString = await getDatabaseUrl();
      log.info("Connecting to database for UiPath results");
      return new Pool({ connectionString, max: 2 });
    })();
  }
  return poolPromise;
}
