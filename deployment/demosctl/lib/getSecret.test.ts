import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { getSecret } from "./getSecret";

describe("getSecret", () => {
  test("requests secret with proper parameters", async () => {
    const spy = vi.spyOn(SecretsManagerClient.prototype, "send") as vi.Mock;

    spy.mockResolvedValueOnce({ SecretString: "secret" }); // pragma: allowlist secret

    expect(await getSecret("test")).toEqual("secret");

    expect(spy).toHaveBeenCalledWith(expect.any(GetSecretValueCommand));
    expect((spy.mock.calls[0][0] as GetSecretValueCommand).input).toEqual({
      SecretId: "test", // pragma: allowlist secret
    });
  });
});
