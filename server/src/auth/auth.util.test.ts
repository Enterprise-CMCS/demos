import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GraphQLError } from "graphql";
import { IncomingMessage } from "http";
import { APIGatewayProxyEventHeaders } from "aws-lambda";

// Mock dependencies
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("jwks-rsa", () => ({
  default: vi.fn(() => ({
    getSigningKey: vi.fn(),
  })),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  GetSecretValueCommand: vi.fn(),
}));

vi.mock("./auth.config.js", () => ({
  getAuthConfig: vi.fn(() => ({
    audience: "test-audience",
    issuer: "test-issuer",
    jwksUri: "https://test.jwks.uri",
  })),
}));

vi.mock("../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    person: {
      create: vi.fn(),
    },
  })),
}));

vi.mock("../constants", () => ({
  PERSON_TYPES: ["demos-admin", "demos-cms-user", "demos-state-user", "non-user-contact"],
}));

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { prisma } from "../prismaClient.js";
import {
  buildLambdaContext,
  buildHttpContext,
  assertContextUserExists,
  getCurrentUserRoleId,
  getCurrentUserId,  
  GraphQLContext,
} from "./auth.util";

describe("auth.util", () => {
  const mockJwks = {
    getSigningKey: vi.fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    person: {
      create: vi.fn(),
    },
  };

  const mockSecretsManager = {
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (jwksClient as any).mockReturnValue(mockJwks);
    (prisma as any).mockReturnValue(mockPrisma);
    (SecretsManagerClient as any).mockReturnValue(mockSecretsManager);
  });

  afterEach(() => {
    delete process.env.DATABASE_SECRET_ARN;
    delete process.env.AWS_REGION;
  });

  describe("buildLambdaContext", () => {
    it("should build context from x-authorizer-claims header", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({
        user: {
          id: "user-id",
          sub: "test-sub",
          role: "demos-admin",
        },
      });
    });

    it("should handle X-Authorizer-Claims header (uppercase)", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-cms-user",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "X-Authorizer-Claims": JSON.stringify(claims),
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-cms-user",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.role).toBe("demos-cms-user");
    });

    it("should fallback to Bearer token when no authorizer claims", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        authorization: "Bearer valid-token",
      };

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-state-user",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-state-user",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.role).toBe("demos-state-user");
    });

    it("should extract token from cookie if no authorization header", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        cookie: "id_token=valid-token; other=value",
      };

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        expect(token).toBe("valid-token");
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.role).toBe("demos-admin");
    });

    it("should return null user when no token provided", async () => {
      const headers: APIGatewayProxyEventHeaders = {};

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should return null user when token verification fails", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        authorization: "Bearer invalid-token",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        callback(new Error("Invalid token"));
      });

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should handle malformed x-authorizer-claims", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": "invalid-json",
        authorization: "Bearer fallback-token",
      };

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.role).toBe("demos-admin");
    });

    it("should create new user when user doesn't exist", async () => {
      const claims = {
        sub: "new-user-sub",
        email: "new@example.com",
        "custom:roles": "demos-admin",
        given_name: "John",
        family_name: "Doe",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockPerson = {
        id: "person-id",
        personTypeId: "demos-admin",
        email: "new@example.com",
        fullName: "John Doe",
        displayName: "John",
      };

      const mockUser = {
        id: "person-id",
        personTypeId: "demos-admin",
        cognitoSubject: "new-user-sub",
        username: "new",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(mockPrisma.person.create).toHaveBeenCalledWith({
        data: {
          personTypeId: "demos-admin",
          email: "new@example.com",
          fullName: "John Doe",
          displayName: "John",
        },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: "person-id",
          personTypeId: "demos-admin",
          cognitoSubject: "new-user-sub",
          username: "new",
        },
      });

      expect(result.user?.id).toBe("person-id");
    });

    it("should handle role field instead of custom:roles", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        role: "demos-admin",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.role).toBe("demos-admin");
    });

    it("should throw error for invalid role", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "invalid-role",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should throw error for missing role", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should throw error for missing sub", async () => {
      const claims = {
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should handle external user ID from identities", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
        identities: JSON.stringify([{ userId: "external-123" }]),
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockPerson = {
        id: "person-id",
        personTypeId: "demos-admin",
        email: "test@example.com",
        fullName: "test@example.com",
        displayName: "external-123",
      };

      const mockUser = {
        id: "person-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "external-123",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: "person-id",
          personTypeId: "demos-admin",
          cognitoSubject: "test-sub",
          username: "external-123",
        },
      });
    });

    it("should handle malformed identities claim", async () => {
      const claims = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
        identities: "invalid-json",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildLambdaContext(headers);

      expect(result.user?.id).toBe("user-id");
    });
  });

  describe("buildHttpContext", () => {
    it("should build context from Authorization header", async () => {
      const mockReq = {
        headers: {
          authorization: "Bearer valid-token",
        },
      } as IncomingMessage;

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildHttpContext(mockReq);

      expect(result.user?.role).toBe("demos-admin");
    });

    it("should return null user when no token provided", async () => {
      const mockReq = {
        headers: {},
      } as IncomingMessage;

      const result = await buildHttpContext(mockReq);

      expect(result).toEqual({ user: null });
    });

    it("should handle cookie-based tokens", async () => {
      const mockReq = {
        headers: {
          cookie: "access_token=Bearer valid-token; other=value",
        },
      } as IncomingMessage;

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        expect(token).toBe("valid-token");
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await buildHttpContext(mockReq);

      expect(result.user?.role).toBe("demos-admin");
    });
  });

  describe("assertContextUserExists", () => {
    it("should pass when user exists", () => {
      const context: GraphQLContext = {
        user: { id: "user-id", sub: "test-sub", role: "demos-admin" },
      };

      expect(() => assertContextUserExists(context)).not.toThrow();
    });

    it("should throw GraphQLError when user is null", () => {
      const context: GraphQLContext = { user: null };

      expect(() => assertContextUserExists(context)).toThrow(GraphQLError);
      expect(() => assertContextUserExists(context)).toThrow("User not authenticated");
    });
  });

  describe("getCurrentUserRoleId", () => {
    it("should return user role ID", async () => {
      const context: GraphQLContext = {
        user: { id: "user-id", sub: "test-sub", role: "demos-admin" },
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getCurrentUserRoleId(context);

      expect(result).toBe("demos-admin");
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-id" },
      });
    });

    it("should throw error when user not authenticated", async () => {
      const context: GraphQLContext = { user: null };

      await expect(getCurrentUserRoleId(context)).rejects.toThrow("User not authenticated");
    });

    it("should throw error when user not found in database", async () => {
      const context: GraphQLContext = {
        user: { id: "user-id", sub: "test-sub", role: "demos-admin" },
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(getCurrentUserRoleId(context)).rejects.toThrow("User not found");
    });
  });

  describe("getCurrentUserId", () => {
    it("should return user ID", async () => {
      const context: GraphQLContext = {
        user: { id: "user-id", sub: "test-sub", role: "demos-admin" },
      };

      const result = await getCurrentUserId(context);

      expect(result).toBe("user-id");
    });

    it("should throw error when user not authenticated", async () => {
      const context: GraphQLContext = { user: null };

      await expect(getCurrentUserId(context)).rejects.toThrow("User not authenticated");
    });
  });

  describe("getDatabaseUrl", () => {
    beforeEach(() => {
      // Clear the cache by resetting the module
      vi.resetModules();
    });

    it("should retrieve database URL from secrets manager", async () => {
      process.env.DATABASE_SECRET_ARN = "arn:aws:secretsmanager:region:account:secret:name"; // pragma: allowlist secret
      process.env.AWS_REGION = "us-east-1";

      const mockSecret = {
        username: "testuser",
        password: "testpass",  // pragma: allowlist secret
        host: "localhost",
        port: "5432",
        dbname: "testdb",
      };

      mockSecretsManager.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      const { getDatabaseUrl } = await import("./auth.util");
      const result = await getDatabaseUrl();

      expect(result).toBe("postgresql://testuser:testpass@localhost:5432/testdb?schema=demos_app"); /// pragma: allowlist secret
      expect(GetSecretValueCommand).toHaveBeenCalledWith({ // pragma: allowlist secret
        SecretId: "arn:aws:secretsmanager:region:account:secret:name",  // pragma: allowlist secret
      });
    });

    it("should use cached database URL on subsequent calls", async () => {
      process.env.DATABASE_SECRET_ARN = "arn:aws:secretsmanager:region:account:secret:name"; // pragma: allowlist secret

      const mockSecret = {
        username: "testuser",
        password: "testpass", // pragma: allowlist secret
        host: "localhost",
        port: "5432",
        dbname: "testdb",
      };

      mockSecretsManager.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      const { getDatabaseUrl } = await import("./auth.util");
      
      // First call
      await getDatabaseUrl();
      // Second call should use cache
      await getDatabaseUrl();

      expect(mockSecretsManager.send).toHaveBeenCalledTimes(1);
    });

    it("should throw error when SecretString is undefined", async () => {
      process.env.DATABASE_SECRET_ARN = "arn:aws:secretsmanager:region:account:secret:name"; // pragma: allowlist secret

      mockSecretsManager.send.mockResolvedValue({
        SecretString: undefined,
      });

      const { getDatabaseUrl } = await import("./auth.util");

      await expect(getDatabaseUrl()).rejects.toThrow("The SecretString value is undefined!");
    });
  });

  describe("cookie parsing", () => {
    it("should parse cookies correctly", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        cookie: "id_token=token123; access_token=token456; other=value%20with%20spaces",
      };

      const mockDecodedToken = {
        sub: "test-sub",
        email: "test@example.com",
        "custom:roles": "demos-admin",
      };

      const mockUser = {
        id: "user-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "test",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, { getPublicKey: () => "mock-public-key" });
      });

      (jwt.verify as any).mockImplementation((token, getKey, options, callback) => {
        expect(token).toBe("token123"); // Should prefer id_token
        callback(null, mockDecodedToken);
      });

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await buildLambdaContext(headers);

      expect(jwt.verify).toHaveBeenCalledWith(
        "token123",
        expect.any(Function),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("should handle empty cookies", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        cookie: "",
      };

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should handle malformed cookies", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        cookie: "malformed",
      };

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });
  });

  describe("JWKS error handling", () => {
    it("should handle JWKS signing key error", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        authorization: "Bearer valid-token",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(new Error("JWKS error"));
      });

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });

    it("should handle missing signing key", async () => {
      const headers: APIGatewayProxyEventHeaders = {
        authorization: "Bearer valid-token",
      };

      mockJwks.getSigningKey.mockImplementation((kid, callback) => {
        callback(null, null);
      });

      const result = await buildLambdaContext(headers);

      expect(result).toEqual({ user: null });
    });
  });

  describe("username derivation", () => {
    it("should derive username from email when no external user ID", async () => {
      const claims = {
        sub: "test-sub",
        email: "username@example.com",
        "custom:roles": "demos-admin",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockPerson = {
        id: "person-id",
        personTypeId: "demos-admin",
        email: "username@example.com",
        fullName: "username@example.com",
        displayName: "username",
      };

      const mockUser = {
        id: "person-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub",
        username: "username",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await buildLambdaContext(headers);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: "person-id",
          personTypeId: "demos-admin",
          cognitoSubject: "test-sub",
          username: "username",
        },
      });
    });

    it("should use sub as fallback username", async () => {
      const claims = {
        sub: "test-sub-123",
        "custom:roles": "demos-admin",
      };
      
      const headers: APIGatewayProxyEventHeaders = {
        "x-authorizer-claims": JSON.stringify(claims),
      };

      const mockPerson = {
        id: "person-id",
        personTypeId: "demos-admin",
        email: "test-sub-123@no-email.local",
        fullName: "test-sub-123",
        displayName: "test-sub-123",
      };

      const mockUser = {
        id: "person-id",
        personTypeId: "demos-admin",
        cognitoSubject: "test-sub-123",
        username: "test-sub-123",
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.person.create.mockResolvedValue(mockPerson);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      await buildLambdaContext(headers);

      expect(mockPrisma.person.create).toHaveBeenCalledWith({
        data: {
          personTypeId: "demos-admin",
          email: "test-sub-123@no-email.local",
          fullName: "test-sub-123",
          displayName: "test-sub-123",
        },
      });
    });
  });
});