import axios from "axios";

interface TokenResponse {
  access_token: string;
}

const TOKEN_URL = "https://govcloud.uipath.us/identity_/connect/token";
const TOKEN_SCOPE =
  "Du.Digitization.Api Du.Classification.Api Du.Extraction.Api Du.Validation.Api Du.DataDeletion.Api";

export async function getToken(): Promise<string> {
  const clientId = process.env.UIPATH_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("UIPATH_CLIENT_ID and UIPATH_CLIENT_SECRET must be set in the environment.");
  }

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
