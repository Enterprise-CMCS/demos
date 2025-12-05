import axios from "axios";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

interface TokenResponse {
  access_token: string;
}

interface UiPathCredentials {
  clientId: string;
  clientSecret: string;
}

const TOKEN_URL = "https://govcloud.uipath.us/identity_/connect/token";
const TOKEN_SCOPE =
  "Du.Digitization.Api Du.Classification.Api Du.Extraction.Api Du.Validation.Api Du.DataDeletion.Api";

const secretsManagerRegion = process.env.AWS_REGION || "us-east-1";
const secretsManagerConfig = process.env.AWS_ENDPOINT_URL
  ? { region: secretsManagerRegion, endpoint: process.env.AWS_ENDPOINT_URL }
  : { region: secretsManagerRegion };
const secretsManager = new SecretsManagerClient(secretsManagerConfig);

async function getCredentials(): Promise<UiPathCredentials> {
  const secretId = process.env.UIPATH_SECRET_ID;

  if (!secretId) {
    throw new Error("UIPATH_SECRET_ID must be set to the UiPath credential secret name/ARN.");
  }

  try {
    const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretId }));
    const secretString = response.SecretString;

    if (!secretString) {
      throw new Error("UiPath secret is missing a SecretString value.");
    }

    try {
      const parsedSecret = JSON.parse(secretString);
      const clientId = parsedSecret.clientId ?? parsedSecret.UIPATH_CLIENT_ID;
      console.log('clientId', clientId);
      const clientSecret =
        parsedSecret.clientSecret ?? parsedSecret.client_secret ?? parsedSecret.UIPATH_CLIENT_SECRET;
      console.log('clientSecret', clientSecret ? clientSecret.substring(0, 5) : "NO SECRET!");
      if (clientId && clientSecret) {
        return { clientId, clientSecret };
      }
    } catch {
      // fall through to error below
    }

    throw new Error("UiPath secret must contain clientId/clientSecret fields.");
  } catch (error) {
    throw new Error(
      `Failed to retrieve UiPath credentials from Secrets Manager: ${(error as Error).message}`
    );
  }
}

export async function getToken(): Promise<string> {
  const { clientId, clientSecret } = await getCredentials();

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("scope", TOKEN_SCOPE);

  const tokenResponse = await axios.post<TokenResponse>(TOKEN_URL, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
  });

  const token = tokenResponse.data?.access_token;
  if (!token) {
    throw new Error("Auth token not returned from UiPath.");
  }
  return token;
}
