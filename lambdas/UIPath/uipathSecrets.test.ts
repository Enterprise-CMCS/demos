import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => {
  class SecretsManagerClient {
    send = mocks.sendMock;
  }

  class GetSecretValueCommand {
    constructor(public input: unknown) {}
  }

  return { SecretsManagerClient, GetSecretValueCommand };
});

const loadModule = async () => {
  return await import("./uipathSecrets");
};

describe("getUiPathSecret", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.sendMock.mockReset();
    delete process.env.UIPATH_SECRET_ID;
  });

  it("returns parsed secrets and caches the result", async () => {
    process.env.UIPATH_SECRET_ID = "uipath-ref";
    const { getUiPathSecret } = await loadModule();
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        clientId: "client-1",
        clientSecret: "value-1", // pragma: allowlist secret
      }),
    });

    const first = await getUiPathSecret();
    const second = await getUiPathSecret();

    expect(first).toEqual({
      clientId: "client-1",
      clientSecret: "value-1", // pragma: allowlist secret
    });
    expect(second).toEqual(first);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
  });

  it("throws when UIPATH_SECRET_ID is not set", async () => {
    const { getUiPathSecret } = await loadModule();
    await expect(getUiPathSecret()).rejects.toThrow(
      "UIPATH_SECRET_ID must be set to the UiPath credential secret name/ARN."
    );
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("throws when secret value is missing SecretString", async () => {
    process.env.UIPATH_SECRET_ID = "uipath-ref";
    const { getUiPathSecret } = await loadModule();
    mocks.sendMock.mockResolvedValue({});

    await expect(getUiPathSecret()).rejects.toThrow(
      "UiPath secret is missing a SecretString value."
    );
  });
});
