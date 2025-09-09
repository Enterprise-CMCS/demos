import { Pool } from "pg";

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getDBSecretArn, getRegion } from "../util/env";

let pool: Pool | null = null;
export async function getPool() {
  if (pool) return pool;

  const connectionString = await getDatabaseUrl();
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return pool;
}

let databaseSecret = "";

export const getDatabaseSecret = async () => {
  if (databaseSecret) return JSON.parse(databaseSecret);
  const secretsManager = new SecretsManagerClient({ region: getRegion() || "us-east-1" });
  const secretArn = getDBSecretArn();
  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!response.SecretString) throw new Error("database secret not defined");
  databaseSecret = response.SecretString;
  return JSON.parse(response.SecretString);
};

export const getDatabaseUrl = async () => {
  const s = await getDatabaseSecret();
  return `postgresql://${s.username}:${s.password}@${s.host}:${s.port}/${s.dbname}?schema=demos_app`;
};
