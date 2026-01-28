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

describe("getUiPathSecret", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.sendMock.mockReset();
  });

  it("returns parsed secrets and caches the result", async () => {
    process.env.UIPATH_SECRET_ID = "uipath-ref";
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        clientId: "client-1",
        clientSecret: "value-1", // pragma: allowlist secret
        extractorGuid: "guid-1",
      }),
    });

    const first = await getUiPathSecret();
    const second = await getUiPathSecret();

    expect(first).toEqual({
      clientId: "client-1",
      clientSecret: "value-1", // pragma: allowlist secret
      extractorGuid: "guid-1",
    });
    expect(second).toEqual(first);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
  });
});

import { getUiPathSecret } from "./uipathSecrets";
