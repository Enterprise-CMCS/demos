import { describe, it, vi, expect, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

import { extractAuthorizerClaims, withAuthorizerHeader } from "./server";
import { buildLambdaContext } from "./auth/auth.util.ts";

// Shared spies
const userFindUnique = vi.fn();
const userCreate     = vi.fn();
const personCreate   = vi.fn();

// Prisma: mock BOTH specifiers that your code might use
vi.mock("./prismaClient.js", () => ({
  prisma: () => ({
    user:   { findUnique: userFindUnique, create: userCreate },
    person: { create: personCreate },
  }),
}));
vi.mock("../prismaClient.js", () => ({
  prisma: () => ({
    user:   { findUnique: userFindUnique, create: userCreate },
    person: { create: personCreate },
  }),
}));

// Logger: mock BOTH specifiers
vi.mock("./logger.js", () => ({
  log: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
  setRequestContext: vi.fn(),
  addToRequestContext: vi.fn(),
}));
vi.mock("../logger.js", () => ({
  log: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
  setRequestContext: vi.fn(),
  addToRequestContext: vi.fn(),
}));

// Auth config (single specifier is fine here)
vi.mock("./auth/auth.config.js", () => ({
  getAuthConfig: () => ({
    audience: "test-audience",
    issuer: "https://issuer.example/",
    jwksUri: "https://issuer.example/.well-known/jwks.json",
  }),
}));

// JWT libs (defensive)
vi.mock("jwks-rsa", () => ({ default: vi.fn(() => ({})) }));
vi.mock("jsonwebtoken", () => ({ default: {}, verify: vi.fn() }));

// (Optional) smoke signal to confirm which mock path gets hit
console.log("[TEST] prisma mock wired");

// Mock environment variables required by adapters
beforeEach(() => {
  process.env.UPLOAD_BUCKET = "test-upload-bucket";
  process.env.CLEAN_BUCKET = "test-clean-bucket";
  process.env.DELETED_BUCKET = "test-deleted-bucket";
});

// Minimal APIGatewayProxyEvent with authorizer claims that match your screenshot
function makeEvent(): APIGatewayProxyEvent {
  const identitiesString = JSON.stringify([
    {
      dateCreated: "1754511350609",
      userId: "ABCD",
      providerName: "demos-obiwan-idm",
      providerType: "SAML",
      issuer: "http://www.okta.com/exky6bddrj7f9Wp7v297",
      primary: "true",
    },
  ]);

  return {
    body: null,
    headers: {},
    httpMethod: "POST",
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    path: "/graphql",
    pathParameters: null,
    queryStringParameters: null,
    resource: "/{proxy+}",
    stageVariables: null,
    requestContext: {
      accountId: "1234567890",
      apiId: "abc123",
      authorizer: {
        "custom:roles": "demos-cms-user",
        role: "demos-cms-user", // 👈 add this for now
        email: "somehuman@example.com",
        family_name: "Kenobi",
        given_name: "obiwan",
        identities: identitiesString, // JSON string
        sub: "74a88478-1081-702f-2d85-a65bf907a154",
        "cognito:username": "somehuman@example.com",
      },
      protocol: "HTTP/1.1",
      httpMethod: "POST",
      identity: {} as any,
      path: "/graphql",
      requestId: "req-123",
      requestTimeEpoch: Date.now(),
      resourceId: "res-1",
      resourcePath: "/{proxy+}",
      stage: "prod",
    } as any,
  } as APIGatewayProxyEvent;
}

beforeEach(() => {
  userFindUnique.mockReset().mockResolvedValue({
    id: "user-123",
    personTypeId: "demos-cms-user",
    cognitoSubject: "74a88478-1081-702f-2d85-a65bf907a154",
    username: "ABCD",
  });
  userCreate.mockReset().mockResolvedValue({
    id: "new-user-123",
    personTypeId: "demos-cms-user",
    cognitoSubject: "74a88478-1081-702f-2d85-a65bf907a154",
    username: "ABCD",
  });
  personCreate.mockReset().mockResolvedValue({
    id: "new-person-123",
    personTypeId: "demos-cms-user",
    email: "somehuman@example.com",
    firstName: "obiwan",
    lastName: "Kenobi",
  });
});
// --- Tests ------------------------------------------------------------------

function patchHeaderClaimsForCompat(headers: Record<string, any>) {
  const key = "x-authorizer-claims";
  const raw = headers[key];
  if (!raw || typeof raw !== "string") return;

  const claims = JSON.parse(raw);

  // Ensure a role is present (normalizer accepts either key)
  claims["custom:roles"] = claims["custom:roles"] || claims.role || "demos-cms-user";

  // Ensure snake_case name keys exist (some code reads these)
  if (claims.givenName && !claims.given_name) claims.given_name = claims.givenName;
  if (claims.familyName && !claims.family_name) claims.family_name = claims.familyName;

  headers[key] = JSON.stringify(claims);
}

describe("Lambda entrypoint claims plumbing", () => {
  it("extracts claims from API Gateway authorizer and builds a user context via x-authorizer-claims", async () => {
    const event = makeEvent();

    // 1) Pull claims from requestContext.authorizer
    const claims = extractAuthorizerClaims(event);
    expect(claims).toBeTruthy();
    expect(claims?.sub).toBe("74a88478-1081-702f-2d85-a65bf907a154");
    expect(claims?.role).toBe("demos-cms-user");
    expect(claims?.givenName).toBe("obiwan");
    expect(claims?.familyName).toBe("Kenobi");

    const headersWithClaims = withAuthorizerHeader(event.headers, claims);
    expect(typeof headersWithClaims["x-authorizer-claims"]).toBe("string");

    // 3) Build GraphQL context using the fast-path (no JWT verification)
    const gqlCtx = await buildLambdaContext(headersWithClaims);

    // 4) Assert we got a user and role mapped correctly
    expect(gqlCtx.user).toBeTruthy();
    expect(gqlCtx.user?.id).toBe("user-123");
    expect(gqlCtx.user?.role).toBe("demos-cms-user");
    expect(gqlCtx.user?.sub).toBe("74a88478-1081-702f-2d85-a65bf907a154");
  });

  it("falls back to email as username if identities.userId missing", async () => {
    const event = makeEvent();

    (event.requestContext.authorizer as any).identities = JSON.stringify([
      { providerType: "SAML", issuer: "http://idp.example" }
    ]);

    const claims = extractAuthorizerClaims(event);
    const headersWithClaims = withAuthorizerHeader(event.headers, claims);
    const gqlCtx = await buildLambdaContext(headersWithClaims);

    expect(gqlCtx.user).toBeTruthy();
    expect(gqlCtx.user?.id).toBe("user-123");
  });

  it("sets username from identities.userId when identities exist", async () => {
    const event = makeEvent();
    userFindUnique.mockResolvedValueOnce(null); // no existing user

    const claims = extractAuthorizerClaims(event);
    const headers = withAuthorizerHeader(event.headers, claims);

    const ctx = await buildLambdaContext(headers);

    expect(personCreate).toHaveBeenCalledTimes(1);
    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(userCreate.mock.calls[0][0]).toMatchObject({
      data: {
        username: "ABCD",
        cognitoSubject: expect.stringMatching(/^74a8/)
      },
    });
    expect(ctx.user?.id).toBe("new-user-123");
  });
});
