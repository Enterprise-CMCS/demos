import { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import { handler } from "./";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { log } from "./log";

const mockContext = { awsRequestId: "00000000-aaaa-bbbb-cccc-000000000000" } as Context;

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

    const resp = await handler(mockEvent, mockContext);
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
    const infoSpy = vi.spyOn(log, "info");

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("token is not set"));
  });

  it("should throw an error for invalid token", async () => {
    const mockEvent: APIGatewayTokenAuthorizerEvent = {
      type: "TOKEN",
      methodArn: "mock:arn",
      authorizationToken: `Bearer invalidtoken`,
    };

    const infoSpy = vi.spyOn(log, "info");

    vi.spyOn(jwt, "verify").mockImplementationOnce((token, gk, _, f) => {
      f(null, undefined);
    });
    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({error: expect.any(String)}),
      expect.stringContaining("rejected with invalid token")
    );
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

    const infoSpy = vi.spyOn(log, "info");

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("user sub is missing"));
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

    const infoSpy = vi.spyOn(log, "info");

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({sub: expect.any(String)}),
      expect.stringContaining("user has no roles")
    );
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

    const infoSpy = vi.spyOn(log, "info");

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({sub: expect.anything(), roles: expect.anything()}),
      expect.stringContaining("user has invalid roles")
    );
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

    const infoSpy = vi.spyOn(log, "info");

    await expect(handler(mockEvent, mockContext)).rejects.toThrow("Unauthorized");

    expect(infoSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining("rejected with invalid token")
    );
  });
});
