import { describe, it, vi, expect, beforeAll, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";
let extractClaimsFromEvent!: typeof import("./server").extractClaimsFromEvent;

// Shared spies
const userFindUnique = vi.fn();
const userCreate = vi.fn();
const personCreate = vi.fn();

// Prisma: mock BOTH specifiers that your code might use
vi.mock("./prismaClient.js", () => ({
  prisma: () => ({
    user: { findUnique: userFindUnique, create: userCreate },
    person: { create: personCreate },
  }),
}));
vi.mock("../prismaClient.js", () => ({
  prisma: () => ({
    user: { findUnique: userFindUnique, create: userCreate },
    person: { create: personCreate },
  }),
}));

// Logger: mock BOTH specifiers
vi.mock("./logger.js", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  setRequestContext: vi.fn(),
  addToRequestContext: vi.fn(),
}));
vi.mock("../logger.js", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
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
vi.mock("./model/graphql.js", () => ({ typeDefs: "type Query { _empty: String }", resolvers: {} }));

// JWT libs (defensive)
vi.mock("jwks-rsa", () => ({ default: vi.fn(() => ({})) }));
vi.mock("jsonwebtoken", () => ({ default: {}, verify: vi.fn() }));

// (Optional) smoke signal to confirm which mock path gets hit
console.log("[TEST] prisma mock wired");

beforeAll(async () => {
  ({ extractClaimsFromEvent } = await import("./server"));
});

// Minimal APIGatewayProxyEvent with authorizer claims
function makeEvent(): APIGatewayProxyEvent {
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
        role: "demos-cms-user",
        email: "somehuman@example.com",
        family_name: "Kenobi",
        given_name: "obiwan",
        identities: [{ userId: "ABCD" }],
        sub: "74a88478-1081-702f-2d85-a65bf907a154",
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
describe("extractClaimsFromEvent", () => {
  it("maps authorizer claims into AuthorizationClaims", () => {
    const event = makeEvent();

    const claims = extractClaimsFromEvent(event);

    expect(claims).toEqual({
      email: "somehuman@example.com",
      sub: "74a88478-1081-702f-2d85-a65bf907a154",
      role: "demos-cms-user",
      givenName: "obiwan",
      familyName: "Kenobi",
      externalUserId: "ABCD",
    });
  });

  it("throws when the request context has no authorizer", () => {
    const event = makeEvent();
    (event.requestContext as any).authorizer = undefined;

    expect(() => extractClaimsFromEvent(event)).toThrow("Missing authorizer in request context");
  });

  it("throws when the authorizer claims are invalid", () => {
    const event = makeEvent();
    (event.requestContext.authorizer as any).role = "not-a-real-role";

    expect(() => extractClaimsFromEvent(event)).toThrow("Invalid user role: 'not-a-real-role'");
  });
});
