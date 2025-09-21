import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEvent} from "aws-lambda";

// Mock dependencies before importing
vi.mock("@apollo/server", () => ({
  ApolloServer: vi.fn().mockImplementation(() => ({
    // Mock ApolloServer instance
  })),
}));

vi.mock("@as-integrations/aws-lambda", () => ({
  startServerAndCreateLambdaHandler: vi.fn().mockReturnValue(vi.fn()),
  handlers: {
    createAPIGatewayProxyEventRequestHandler: vi.fn().mockReturnValue({}),
  },
}));

vi.mock("./model/graphql.js", () => ({
  typeDefs: "mock typeDefs",
  resolvers: { Query: {} },
}));

vi.mock("./auth/auth.plugin.js", () => ({
  authGatePlugin: { mock: "plugin" },
}));

vi.mock("./auth/auth.util.js", () => ({
  buildLambdaContext: vi.fn().mockResolvedValue({ user: null }),
  getDatabaseUrl: vi.fn().mockResolvedValue("postgresql://mock-url"),
}));

// Import the functions to test
import {
  extractAuthorizerClaims,
  withAuthorizerHeader,
  graphqlHandler,
} from "./server";

describe("extractAuthorizerClaims", () => {
  it("should return claims when sub is present", () => {
    const event = {
      requestContext: {
        authorizer: { 
          sub: "user123", 
          email: "test@example.com",
          role: "admin"
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toEqual({
      sub: "user123",
      email: "test@example.com",
      role: "admin",
    });
  });

  it("should return claims with undefined email and role when not present", () => {
    const event = {
      requestContext: {
        authorizer: { sub: "user123" },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toEqual({
      sub: "user123",
      email: undefined,
      role: undefined,
    });
  });

  it("should return null when sub is missing", () => {
    const event = {
      requestContext: {
        authorizer: { email: "test@example.com" },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toBeNull();
  });

  it("should return null when sub is empty string", () => {
    const event = {
      requestContext: {
        authorizer: { sub: "", email: "test@example.com" },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toBeNull();
  });

  it("should return null when sub is not a string", () => {
    const event = {
      requestContext: {
        authorizer: { sub: 123, email: "test@example.com" },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toBeNull();
  });

  it("should handle missing requestContext", () => {
    const event = {} as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toBeNull();
  });

  it("should handle missing authorizer", () => {
    const event = {
      requestContext: {},
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toBeNull();
  });

  it("should ignore non-string email", () => {
    const event = {
      requestContext: {
        authorizer: { sub: "user123", email: 123 },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toEqual({
      sub: "user123",
      email: undefined,
      role: undefined,
    });
  });

  it("should ignore non-string role", () => {
    const event = {
      requestContext: {
        authorizer: { sub: "user123", role: 456 },
      },
    } as unknown as APIGatewayProxyEvent;

    const result = extractAuthorizerClaims(event);
    expect(result).toEqual({
      sub: "user123",
      email: undefined,
      role: undefined,
    });
  });
});

describe("withAuthorizerHeader", () => {
  it("should add x-authorizer-claims header when claims are present", () => {
    const headers = { "content-type": "application/json" };
    const claims = { sub: "user123", email: "test@example.com" };

    const result = withAuthorizerHeader(headers, claims);

    expect(result).toEqual({
      "content-type": "application/json",
      "x-authorizer-claims": JSON.stringify(claims),
    });
  });

  it("should return original headers when claims are null", () => {
    const headers = { "content-type": "application/json" };

    const result = withAuthorizerHeader(headers, null);

    expect(result).toEqual(headers);
    expect(result).toBe(headers); // Should be the same reference
  });

  it("should handle empty headers object", () => {
    const headers = {};
    const claims = { sub: "user123" };

    const result = withAuthorizerHeader(headers, claims);

    expect(result).toEqual({
      "x-authorizer-claims": JSON.stringify(claims),
    });
  });
});

describe("graphqlHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("should be defined", () => {
    expect(graphqlHandler).toBeDefined();
    expect(typeof graphqlHandler).toBe("function");
  });

});



