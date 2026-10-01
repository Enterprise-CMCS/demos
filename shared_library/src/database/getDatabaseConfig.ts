import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

import type {PoolConfig} from 'pg'

let cacheExpiration = 0;
let databaseConfigCache: PoolConfig | null = null

const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined,
});

type ForbiddenOptions =
  | "connectionString"
  | "user"
  | "password"
  | "host"
  | "port"
  | "database";

export async function getDatabaseConfig(databaseSecretArn: string, additionalOptions: Omit<PoolConfig,ForbiddenOptions> = {}): Promise<PoolConfig> {
  const now = Date.now();
  if (databaseConfigCache && cacheExpiration > now) {
    return databaseConfigCache;
  }

  if (!databaseSecretArn || databaseSecretArn.trim() === "") {
    throw new Error("Database secret arn must be provided to retrieve credentials"); 
  }

  if (Object.keys(additionalOptions).includes("connectionString")) {
    throw new Error("connectionString should not be set in additional options"); 
  }

  const getDbSecretValueCommand = new GetSecretValueCommand({ SecretId: databaseSecretArn });
  const response = await secretsManagerClient.send(getDbSecretValueCommand);

  if (!response?.SecretString) {
    throw new Error(`The SecretString value is undefined for secret: ${databaseSecretArn}`);
  }

  const dbCredentials = JSON.parse(response.SecretString);
  const sslMode = process.env.DB_SSL_MODE ?? (process.env.BYPASS_SSL ? "disable" : "verify-full");

  const additionalSslOptions = additionalOptions.ssl && typeof additionalOptions.ssl === "object"
   ? additionalOptions.ssl : {};

  databaseConfigCache = {
    ...additionalOptions,
    user: dbCredentials.username,
    host: dbCredentials.host,
    port: dbCredentials.port,
    database: dbCredentials.dbname,
    ssl:
      sslMode === "disable"
        ? false
        : sslMode === "no-verify"
          ? { rejectUnauthorized: false }
          : { 
              ...additionalSslOptions, 
              rejectUnauthorized: true 
            },
  };

  Object.defineProperty(databaseConfigCache, "password", {
    enumerable: false,
    value: dbCredentials.password,
  });

  cacheExpiration = now + 5 * 60 * 1000;

  return databaseConfigCache
}
