import axios from "axios";
import { getUiPathSecret } from "./uipathSecrets";

type TokenResponse = {
  access_token?: string;
};

type UiPathCredentials = {
  clientId: string;
  clientSecret: string;
};

const TOKEN_URL = "https://govcloud.uipath.us/identity_/connect/token";

function rejectPlaceholderCredentials(credentials: UiPathCredentials): void {
  if (
    credentials.clientId === "local-uipath-client-id" || // pragma: allowlist secret
    credentials.clientSecret === "local-uipath-client-secret" // pragma: allowlist secret
  ) {
    throw new Error(
      "UiPath secret contains default placeholder credentials. Set real UIPATH_CLIENT_ID/UIPATH_CLIENT_SECRET."
    );
  }
}

async function getCredentials(): Promise<UiPathCredentials> {
  if (!process.env.UIPATH_SECRET_ID) {
    throw new Error("Missing UIPATH_SECRET_ID or UIPATH_CLIENT_ID/UIPATH_CLIENT_SECRET.");
  }

  try {
    const secretCredentials = await getUiPathSecret();
    const clientId = secretCredentials.clientId ?? undefined;
    const clientSecret = secretCredentials.clientSecret ?? undefined;

    if (clientId && clientSecret) {
      const credentials = { clientId, clientSecret };
      rejectPlaceholderCredentials(credentials);
      return credentials;
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

  const tokenResponse = await axios.post<TokenResponse>(TOKEN_URL, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    }
  });

  const token = tokenResponse.data?.access_token;
  if (!token) {
    throw new Error("Auth token not returned from UiPath.");
  }

  return token;
}
