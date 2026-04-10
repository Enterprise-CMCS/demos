import { beforeEach, describe, expect, it, vi } from "vitest";
import { GraphQLError } from "graphql";

const { getSigningKeyMock, verifyMock } = vi.hoisted(() => ({
  getSigningKeyMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("jwks-rsa", () => ({
  default: vi.fn(() => ({
    getSigningKey: getSigningKeyMock,
  })),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: verifyMock,
  },
}));

describe("decodeToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies the token and returns the decoded payload", async () => {
    const decoded = {
      sub: "sub-123",
      email: "user@example.com",
    };

    getSigningKeyMock.mockImplementation((kid, cb) => {
      cb(null, {
        getPublicKey: () => "public-key",
      });
    });

    verifyMock.mockImplementation((token, getKey, verifyOpts, cb) => {
      expect(token).toBe("token-123");
      expect(verifyOpts).toEqual({
        audience: "5p61qososiui75cmclcift45oi",
        issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FCc2lmZDJ",
        algorithms: ["RS256"],
      });

      getKey({ kid: "kid-123" }, (err: Error | null, key?: string) => {
        expect(err).toBeNull();
        expect(key).toBe("public-key");
        cb(null, decoded);
      });
    });

    const { decodeToken } = await import("./decodeToken");

    await expect(decodeToken("token-123")).resolves.toEqual(decoded);
    expect(getSigningKeyMock).toHaveBeenCalledExactlyOnceWith("kid-123", expect.any(Function));
  });

  it("rejects when jwt verification fails", async () => {
    verifyMock.mockImplementation((_token, _getKey, _verifyOpts, cb) => {
      cb(new Error("bad token"));
    });

    const { decodeToken } = await import("./decodeToken");

    await expect(decodeToken("token-123")).rejects.toEqual(
      new GraphQLError("User is not authenticated", {
        extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
      })
    );
  });

  it("rejects when decoded token is not an object", async () => {
    verifyMock.mockImplementation((_token, _getKey, _verifyOpts, cb) => {
      cb(null, "not-an-object");
    });

    const { decodeToken } = await import("./decodeToken");

    await expect(decodeToken("token-123")).rejects.toEqual(
      new GraphQLError("User is not authenticated", {
        extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
      })
    );
  });

  it("rejects when decoded token is an array", async () => {
    verifyMock.mockImplementation((_token, _getKey, _verifyOpts, cb) => {
      cb(null, ["not", "valid"]);
    });

    const { decodeToken } = await import("./decodeToken");

    await expect(decodeToken("token-123")).rejects.toEqual(
      new GraphQLError("User is not authenticated", {
        extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
      })
    );
  });
});
