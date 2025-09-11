import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { addCognitoRedirect } from "./addCognitoRedirect";

describe("addCognitoRedirect", () => {
  test("should properly add a redirect", async () => {
    const spy = jest.spyOn(CognitoIdentityProviderClient.prototype, "send") as jest.Mock;

    spy.mockResolvedValue({ UserPoolClient: { CallbackURLs: ["existing"] } });
    await addCognitoRedirect("user-pool-id", "client-id", "additional-redirect");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { ClientId: "client-id", UserPoolId: "user-pool-id" },
      })
    );

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { CallbackURLs: ["existing", "additional-redirect"] },
      })
    );
  });
  test("should throw if user pool client doesn't exist", async () => {
    const spy = jest.spyOn(CognitoIdentityProviderClient.prototype, "send");

    //@ts-expect-error prevent error related to conflict of types
    spy.mockResolvedValue({});
    await expect(addCognitoRedirect("user-pool-id", "client-id", "additional-redirect")).rejects.toThrow(
      "Could not find user pool client"
    );
  });
});
