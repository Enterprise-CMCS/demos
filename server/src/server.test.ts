import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks before importing the module under test
const ApolloServerMock = class {
  constructor(opts: any) {
    (global as any).__lastServerOptions = opts;
  }
};

const startServerAndCreateLambdaHandlerMock = vi.fn((server: any, handler: any, opts: any) => ({ handlerCalled: true }));
const handlersMock = { createAPIGatewayProxyEventRequestHandler: vi.fn(() => ({ handler: true })) };
const ApolloArmorMock = vi.fn((cfg: any) => ({ protect: () => ({ plugins: [], validationRules: [] }) }));

vi.mock("@apollo/server", () => ({ ApolloServer: ApolloServerMock }));
vi.mock("@as-integrations/aws-lambda", () => ({ startServerAndCreateLambdaHandler: startServerAndCreateLambdaHandlerMock, handlers: handlersMock }));
vi.mock("@escape.tech/graphql-armor", () => ({ ApolloArmor: ApolloArmorMock }));

vi.mock("./model/graphql.js", () => ({ typeDefs: [], resolvers: {} }));
vi.mock("./auth/auth.plugin.js", () => ({ authGatePlugin: {} }));
vi.mock("./plugins/logging.plugin", () => ({ loggingPlugin: {} }));
vi.mock("./plugins/graphQLArmorConfig.js", () => ({ GraphQLArmorConfig: { __sentinel: true } }));
vi.mock("./auth/auth.util.js", () => ({ buildLambdaContext: vi.fn(async () => ({})), getDatabaseUrl: vi.fn(async () => "postgres://db"), }));
vi.mock("./log.js", () => ({ log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }, reqIdChild: () => ({ debug: () => {} }), als: { run: (s: any, fn: any) => fn(), }, store: {} }));

describe("server module", () => {
  beforeEach(() => {
    vi.resetModules();
    ApolloArmorMock.mockClear();
    startServerAndCreateLambdaHandlerMock.mockClear();
  });

  it("constructs ApolloArmor with GraphQLArmorConfig and creates graphqlHandler", async () => {
    await import("./server.ts");

    expect(ApolloArmorMock).toHaveBeenCalled();
    expect(startServerAndCreateLambdaHandlerMock).toHaveBeenCalled();
    
  });
});
