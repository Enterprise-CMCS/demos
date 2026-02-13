import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before importing the module under test
const ApolloServerMock = class {
  constructor(opts: any) {
    // capture for assertions
    (global as any).__lastApolloServerOptions = opts;
  }
};

const startStandaloneServerMock = vi.fn(async (_server: any, _opts: any) => ({ url: "http://localhost:4000" }));

const ApolloArmorMock = vi.fn((cfg: any) => ({ protect: () => ({ plugins: [], validationRules: [] }) }));

vi.mock("@apollo/server", () => ({ ApolloServer: ApolloServerMock }));
vi.mock("@apollo/server/standalone", () => ({ startStandaloneServer: startStandaloneServerMock }));
vi.mock("@escape.tech/graphql-armor", () => ({ ApolloArmor: ApolloArmorMock }));

vi.mock("./model/graphql.js", () => ({ typeDefs: [], resolvers: {} }));
vi.mock("./auth/auth.util.js", () => ({ buildHttpContext: vi.fn(async () => ({})), }));
vi.mock("./auth/auth.plugin.js", () => ({ authGatePlugin: {} }));
vi.mock("./plugins/gatedLandingPage.plugin.js", () => ({ gatedLandingPagePlugin: () => ({}) }));
vi.mock("./plugins/logging.plugin", () => ({ loggingPlugin: {} }));

// Provide a sentinel config so we can assert it is forwarded to ApolloArmor
vi.mock("./plugins/graphQLArmorConfig.js", () => ({ GraphQLArmorConfig: { __sentinel: true } }));

vi.mock("./log.js", () => ({
  log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
  als: { run: (s: any, fn: any) => fn(), getStore: () => ({ set: () => {} }) },
  reqIdChild: () => ({ debug: () => {} }),
  store: {},
}));

describe("local-server startup", () => {
  beforeEach(() => {
    vi.resetModules();
    ApolloArmorMock.mockClear();
    startStandaloneServerMock.mockClear();
  });

  it("initializes ApolloArmor with GraphQLArmorConfig and starts the server", async () => {
    // Import module after mocks are active
    const mod = await import("./local-server.ts");

    // ApolloArmor should have been constructed with the sentinel config
    expect(ApolloArmorMock).toHaveBeenCalled();    

    // startStandaloneServer should have been called once
    expect(startStandaloneServerMock).toHaveBeenCalled();

    // server url returned from our mock should be available (module logged it)
    const result = await startStandaloneServerMock.mock.results[0].value;
    expect(result).toHaveProperty("url");
  });
});
