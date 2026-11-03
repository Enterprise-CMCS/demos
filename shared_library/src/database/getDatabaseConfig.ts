import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

import type {PoolConfig} from 'pg'

interface DBConfigCache {
  cacheExpiration: number
  config: PoolConfig
}

let databaseConfigCache: Map<string, DBConfigCache> = new Map()

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

export async function getDatabaseConfig(databaseSecretArn?: string, additionalOptions: Omit<PoolConfig,ForbiddenOptions> = {}): Promise<PoolConfig> {
  if (Object.keys(additionalOptions).includes("connectionString")) {
    throw new Error("connectionString should not be set in additional options"); 
  }

  if (!databaseSecretArn || databaseSecretArn.trim() === "") {
    throw new Error("Database secret arn must be provided to retrieve credentials"); 
  }

  const now = Date.now();
  const cachedConfig = databaseConfigCache.get(databaseSecretArn)
  if (cachedConfig && cachedConfig.cacheExpiration > now) {
    return cachedConfig?.config;
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

  const config: PoolConfig = {
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

  Object.defineProperty(config, "password", {
    enumerable: false,
    value: dbCredentials.password,
  });

  const cacheExpiration = now + 5 * 60 * 1000;

  databaseConfigCache.set(databaseSecretArn, {config, cacheExpiration})

  return config
}
