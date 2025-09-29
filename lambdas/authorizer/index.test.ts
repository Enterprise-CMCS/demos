import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { handler } from "./";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

describe("authorizer", () => {
  it("should pass", async () => {
    const mockToken = "mock-token";
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer ${mockToken}`,
    };

    const mockDecoded = {
      sub: "this-is-a-user",
      email: "unit.test@example.com",
      given_name: "unit",
      family_name: "test",
      "custom:roles": "demos-admin",
    };

    const verifySpy = vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, mockDecoded);
    });

    const resp = await handler(mockEvent);
    expect(verifySpy).toHaveBeenCalledWith(mockToken, expect.anything(), expect.anything(), expect.anything());
    expect(resp).toEqual(
      expect.objectContaining({
        context: expect.objectContaining({
          sub: expect.any(String),
          email: expect.any(String),
          given_name: expect.any(String),
          family_name: expect.any(String),
          role: expect.any(String),
        }),
        policyDocument: expect.objectContaining({
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: "execute-api:Invoke",
              Effect: "Allow",
            }),
          ]),
        }),
      })
    );
  });

  it("should throw an error for missing token", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `invalid`,
    };
    const errorSpy = vi.spyOn(console, "error");

    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith("no token");
  });

  it("should throw an error for invalid token", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer invalidtoken`,
    };

    const errorSpy = vi.spyOn(console, "error");

    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, undefined);
    });
    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("rejected with invalid token"));
  });

  it("should throw an error if the `sub` is missing", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer missingsub`,
    };
    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, {});
    });

    const errorSpy = vi.spyOn(console, "error");

    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith("user sub is missing");
  });

  it("should throw an error if the token is missing roles", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer missingroles`,
    };
    const mockDecoded = {
      sub: "this-is-a-user",
      email: "unit.test@example.com",
      given_name: "unit",
      family_name: "test",
    };

    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, mockDecoded);
    });

    const errorSpy = vi.spyOn(console, "error");

    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("rejected with no roles"));
  });

  it("should throw an error if the token has invalid roles", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer invalid-roles`,
    };
    const mockDecoded = {
      sub: "this-is-a-user",
      email: "unit.test@example.com",
      given_name: "unit",
      family_name: "test",
      "custom:roles": "demos-not-real",
    };

    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, mockDecoded);
    });

    const errorSpy = vi.spyOn(console, "error");

    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("rejected with invalid roles"));
  });

  it("should throw an error when jwt verification errors", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer invalid-roles`,
    };
    const mockDecoded = {
      sub: "this-is-a-user",
      email: "unit.test@example.com",
      given_name: "unit",
      family_name: "test",
      "custom:roles": "demos-not-real",
    };

    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(new JsonWebTokenError("there was an error"), mockDecoded);
    });

    const errorSpy = vi.spyOn(console, "error");

    await expect(handler(mockEvent)).rejects.toThrow("Unauthorized");

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("rejected with invalid token"));
  });
});
