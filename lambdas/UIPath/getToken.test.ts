import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  postMock: vi.fn(),
  getUiPathSecretMock: vi.fn(),
}));

vi.mock("axios", () => {
  const isAxiosError = (err: unknown) => Boolean((err as { isAxiosError?: boolean })?.isAxiosError);
  return {
    default: { post: mocks.postMock, isAxiosError },
    isAxiosError,
  };
});

vi.mock("./uipathSecrets", () => {
  return { getUiPathSecret: mocks.getUiPathSecretMock };
});

import { getToken } from "./getToken";

describe("getToken", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...prevEnv, UIPATH_SECRET_ID: "uipath-ref" };
    mocks.postMock.mockReset();
    mocks.getUiPathSecretMock.mockReset();
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

  it("logs axios error details and rethrows", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.getUiPathSecretMock.mockResolvedValue({
      clientId: "clientId-1", // pragma: allowlist secret
      clientSecret: "value-1", // pragma: allowlist secret
    });
    mocks.postMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { error: "invalid_client" } },
    });

    await expect(getToken()).rejects.toBeDefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith("UiPath token request failed", {
      status: 400,
      data: { error: "invalid_client" },
    });

    consoleErrorSpy.mockRestore();
  });
});
