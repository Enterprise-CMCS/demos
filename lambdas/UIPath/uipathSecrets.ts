import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export interface UiPathSecret {
  clientId?: string;
  clientSecret?: string;
  extractorGuid?: string;
}

const secretsManagerRegion = process.env.AWS_REGION || "us-east-1";
const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? { region: secretsManagerRegion, endpoint: process.env.AWS_ENDPOINT_URL }
  : { region: secretsManagerRegion };
const secretsManager = new SecretsManagerClient(secretsManagerConfig);

let cachedSecret: UiPathSecret | null = null;

export async function getUiPathSecret(): Promise<UiPathSecret> {
  if (cachedSecret) {
    return cachedSecret;
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
  // This is correct.
  cachedSecret = {
    clientId: parsedSecret.clientId,
    clientSecret: parsedSecret.clientSecret,
    extractorGuid: parsedSecret.extractorGuid,
  };

  return cachedSecret;
}
