import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { AWS_REGION } from "./config";

export interface UiPathSecret {
  clientId?: string;
  clientSecret?: string;
}

const secretsManager = new SecretsManagerClient({
  region: AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL ?? undefined
});

let cachedUiPathSecret: UiPathSecret | null = null;

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
    clientSecret: parsedSecret.clientSecret
  };

  return cachedUiPathSecret;
}
