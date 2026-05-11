import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIGatewayProxyEvent } from "aws-lambda";

// Mocks before importing the module under test
const ApolloServerMock = class {
  constructor(opts: any) {
    (global as any).__lastServerOptions = opts;
  }
};

const startServerAndCreateLambdaHandlerMock = vi.fn((server: any, handler: any, opts: any) => ({
  handlerCalled: true,
}));
const handlersMock = { createAPIGatewayProxyEventRequestHandler: vi.fn(() => ({ handler: true })) };
const ApolloArmorMock = vi.fn(function (this: any, cfg: any) {
  this.protect = () => ({ plugins: [], validationRules: [] });
});
const validateClaimsMock = vi.fn();

vi.mock("@apollo/server", () => ({ ApolloServer: ApolloServerMock }));
vi.mock("@as-integrations/aws-lambda", () => ({
  startServerAndCreateLambdaHandler: startServerAndCreateLambdaHandlerMock,
  handlers: handlersMock,
}));
vi.mock("@escape.tech/graphql-armor", () => ({ ApolloArmor: ApolloArmorMock }));

vi.mock("./model/graphql.js", () => ({ typeDefs: [], resolvers: {} }));
vi.mock("./auth/auth.plugin.js", () => ({ authGatePlugin: {} }));
vi.mock("./plugins/logging.plugin", () => ({ loggingPlugin: {} }));
vi.mock("./plugins/graphQLArmorConfig.js", () => ({ GraphQLArmorConfig: { __sentinel: true } }));
vi.mock("./auth/auth.util.js", () => ({
  buildLambdaContext: vi.fn(async () => ({})),
  buildContextFromClaims: vi.fn(async () => ({ user: { id: "user-1" } })),
  validateClaims: validateClaimsMock,
  getDatabaseUrl: vi.fn(async () => "postgres://db"),
}));
vi.mock("./log.js", () => ({
  log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  reqIdChild: () => ({ debug: () => {} }),
  als: { run: (s: any, fn: any) => fn() },
  store: {},
}));

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
        email: "somehuman@example.com",
        sub: "74a88478-1081-702f-2d85-a65bf907a154",
        role: "demos-cms-user",
        given_name: "obiwan",
        family_name: "Kenobi",
        userId: "ABCD",
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

describe("server module", () => {
  beforeEach(() => {
    vi.resetModules();
    ApolloArmorMock.mockClear();
    startServerAndCreateLambdaHandlerMock.mockClear();
    validateClaimsMock.mockClear();
  });

  it("constructs ApolloArmor with GraphQLArmorConfig and creates graphqlHandler", async () => {
    await import("./server");

    expect(ApolloArmorMock).toHaveBeenCalled();
    expect(startServerAndCreateLambdaHandlerMock).toHaveBeenCalled();
  });

  it("extracts claims from the API Gateway authorizer", async () => {
    const { extractClaimsFromEvent } = await import("./server");

    const claims = extractClaimsFromEvent(makeEvent());

    expect(validateClaimsMock).toHaveBeenCalledExactlyOnceWith({
      email: "somehuman@example.com",
      sub: "74a88478-1081-702f-2d85-a65bf907a154",
      role: "demos-cms-user",
      givenName: "obiwan",
      familyName: "Kenobi",
      externalUserId: "ABCD",
    });
    expect(claims).toEqual({
      email: "somehuman@example.com",
      sub: "74a88478-1081-702f-2d85-a65bf907a154",
      role: "demos-cms-user",
      givenName: "obiwan",
      familyName: "Kenobi",
      externalUserId: "ABCD",
    });
  });
});
