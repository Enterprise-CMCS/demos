import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { region } from "./uipathClient";

export interface UiPathSecret {
  clientId?: string;
  clientSecret?: string;
}

const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? { region, endpoint: process.env.AWS_ENDPOINT_URL }
  : { region };
const secretsManager = new SecretsManagerClient(secretsManagerConfig);

let cachedUiPathSecret: UiPathSecret | null = null;

// Test helper to avoid dynamic module re-import in strict tsconfig module settings.
export function __resetUiPathSecretCacheForTests(): void {
  cachedUiPathSecret = null;
}

export async function getUiPathSecret(): Promise<UiPathSecret> {
  if (cachedUiPathSecret) {
    return cachedUiPathSecret;
  }

  const secretId = process.env.UIPATH_SECRET_ID;
  if (!secretId) {
    throw new Error("UIPATH_SECRET_ID must be set to the UiPath credential secret name/ARN.");
  }

  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretId }));
  const secretString = response.SecretString;

  if (!secretString) {
    throw new Error("UiPath secret is missing a SecretString value.");
  }

  const parsedSecret = JSON.parse(secretString);

  cachedUiPathSecret = {
    clientId: parsedSecret.clientId,
    clientSecret: parsedSecret.clientSecret,
  };

  return cachedUiPathSecret;
}
