import axios from "axios";
import { getUiPathSecret } from "./uipathSecrets";

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

async function getCredentials(): Promise<UiPathCredentials> {

  if (!process.env.UIPATH_SECRET_ID) {
    throw new Error("Missing UIPATH_SECRET_ID or UIPATH_CLIENT_ID/UIPATH_CLIENT_SECRET.");
  }

  try {
    const secret = await getUiPathSecret();
    const clientId = secret.clientId ?? undefined;
    const clientSecret = secret.clientSecret ?? undefined;

    if (clientId && clientSecret) {
      return { clientId, clientSecret };
    }

    throw new Error("UiPath secret must contain clientId/clientSecret fields.");
  } catch (error) {
    console.error(error);
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

  try {
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
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("UiPath token request failed", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
}
