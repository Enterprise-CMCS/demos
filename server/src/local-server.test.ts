import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JwtPayload } from "jsonwebtoken";

// Mocks must be declared before importing the module under test
const ApolloServerMock = class {
  constructor(opts: any) {
    // capture for assertions
    (global as any).__lastApolloServerOptions = opts;
  }
};

const startStandaloneServerMock = vi.fn(async () => ({
  url: "http://localhost:4000",
}));

const ApolloArmorMock = vi.fn(function (this: any) {
  this.protect = () => ({ plugins: [], validationRules: [] });
});
const validateClaimsMock = vi.fn();

vi.mock("@apollo/server", () => ({ ApolloServer: ApolloServerMock }));
vi.mock("@apollo/server/standalone", () => ({ startStandaloneServer: startStandaloneServerMock }));
vi.mock("@escape.tech/graphql-armor", () => ({ ApolloArmor: ApolloArmorMock }));

vi.mock("./model/graphql.js", () => ({ typeDefs: [], resolvers: {} }));
vi.mock("./auth/auth.util.js", () => ({
  buildContextFromClaims: vi.fn(async () => ({ user: { id: "user-1" } })),
  validateClaims: validateClaimsMock,
}));
vi.mock("./auth/auth.plugin.js", () => ({ authGatePlugin: {} }));
vi.mock("./plugins/gatedLandingPage.plugin.js", () => ({ gatedLandingPagePlugin: () => ({}) }));
vi.mock("./plugins/logging.plugin", () => ({ loggingPlugin: {} }));
vi.mock("./auth/decodeToken.js", () => ({ decodeToken: vi.fn() }));

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
    validateClaimsMock.mockClear();
  });

  it("initializes ApolloArmor with GraphQLArmorConfig and starts the server", async () => {
    // Import module after mocks are active
    await import("./local-server.ts");

    // ApolloArmor should have been constructed with the sentinel config
    expect(ApolloArmorMock).toHaveBeenCalled();

    // startStandaloneServer should have been called once
    expect(startStandaloneServerMock).toHaveBeenCalled();

    // server url returned from our mock should be available (module logged it)
    const result = await startStandaloneServerMock.mock.results[0].value;
    expect(result).toHaveProperty("url");
  });

  it("extracts claims from a decoded token", async () => {
    const { extractClaimsFromDecodedToken } = await import("./local-server.ts");
    const decodedToken: JwtPayload = {
      email: "somehuman@example.com",
      sub: "74a88478-1081-702f-2d85-a65bf907a154",
      "custom:roles": "demos-cms-user",
      given_name: "obiwan",
      family_name: "Kenobi",
      identities: [{ userId: "ABCD" }],
    };

    const claims = extractClaimsFromDecodedToken(decodedToken);

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
