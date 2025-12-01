import axios from "axios";

export async function getToken() {
  try {
    const tokenUrl = "https://govcloud.uipath.us/identity_/connect/token";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    // scope must be space-separated; URLSearchParams will handle encoding
    params.append(
      "scope",
      "Du.Digitization.Api Du.Classification.Api Du.Extraction.Api Du.Validation.Api Du.DataDeletion.Api"
    );

    const tokenResponse = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        // Use Basic auth with client_id:client_secret
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64"),
      },
    });

    return tokenResponse.data.access_token;
  } catch (e) {
    console.error("Error obtaining access token:", e);
  }
}
