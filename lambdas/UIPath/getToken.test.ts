import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  postMock: vi.fn(),
  getUiPathSecretMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

vi.mock("./uipathSecrets", () => {
  return { getUiPathSecret: mocks.getUiPathSecretMock };
});

vi.mock("./uipathClient", () => ({
  uipathAxios: {
    post: mocks.postMock,
  },
}));

vi.mock("./log", () => ({
  log: {
    error: mocks.logErrorMock,
  },
}));

import { getToken } from "./getToken";

describe("getToken", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...prevEnv, UIPATH_SECRET_ID: "uipath-ref" };
    mocks.postMock.mockReset();
    mocks.getUiPathSecretMock.mockReset();
    mocks.logErrorMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("returns the access token", async () => {
    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "clientId-1", // pragma: allowlist secret
      clientSecret: "value-1", // pragma: allowlist secret
    });
    mocks.postMock.mockResolvedValue({ data: { access_token: "token-123" } });

    await expect(getToken()).resolves.toBe("token-123");
  });

  it("throws when token is missing from response", async () => {
    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "clientId-1", // pragma: allowlist secret
      clientSecret: "value-1", // pragma: allowlist secret
    });
    mocks.postMock.mockResolvedValue({ data: {} });

    await expect(getToken()).rejects.toThrow("Auth token not returned from UiPath.");
  });

  it("logs and rethrows redacted token request errors from the shared axios client", async () => {
    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "clientId-1", // pragma: allowlist secret
      clientSecret: "value-1", // pragma: allowlist secret
    });
    const redactedError = {
      isErrorRedactedResponse: true,
      message: "Request failed with status code 400",
      fullURL: "https://govcloud.uipath.us/identity_/connect/token",
      response: {
        statusCode: 400,
        statusMessage: "Bad Request",
        data: "<REDACTED>",
      },
      request: {
        baseURL: "",
        path: "https://govcloud.uipath.us/identity_/connect/token",
        method: "post",
        data: "<REDACTED>",
      },
    };
    mocks.postMock.mockRejectedValue(redactedError);

    await expect(getToken()).rejects.toBe(redactedError);

    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: redactedError },
      "UiPath token request failed"
    );
  });

  it("throws when UIPATH_SECRET_ID is missing", async () => {
    delete process.env.UIPATH_SECRET_ID;

    await expect(getToken()).rejects.toThrow(
      "Missing UIPATH_SECRET_ID or UIPATH_CLIENT_ID/UIPATH_CLIENT_SECRET."
    );
    expect(mocks.getUiPathSecretMock).not.toHaveBeenCalled();
  });

  it("rejects placeholder credentials from secret", async () => {
    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "local-uipath-client-id", // pragma: allowlist secret
      clientSecret: "local-uipath-client-secret", // pragma: allowlist secret
    });

    await expect(getToken()).rejects.toThrow(
      "Failed to retrieve UiPath credentials from Secrets Manager: UiPath secret contains default placeholder credentials. Set real UIPATH_CLIENT_ID/UIPATH_CLIENT_SECRET."
    );

    expect(mocks.postMock).not.toHaveBeenCalled();
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      "Failed to retrieve UiPath credentials"
    );
  });

  it("throws when secret does not include both client fields", async () => {
    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "clientId-1",
    });

    await expect(getToken()).rejects.toThrow(
      "Failed to retrieve UiPath credentials from Secrets Manager: UiPath secret must contain clientId/clientSecret fields."
    );
    expect(mocks.postMock).not.toHaveBeenCalled();
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: expect.any(Error) },
      "Failed to retrieve UiPath credentials"
    );
  });
});
