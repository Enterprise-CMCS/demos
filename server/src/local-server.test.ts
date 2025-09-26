import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// Mock dependencies
vi.mock("@apollo/server", () => ({
  ApolloServer: vi.fn(),
}));

vi.mock("@apollo/server/standalone", () => ({
  startStandaloneServer: vi.fn(),
}));

vi.mock("./model/graphql.js", () => ({
  typeDefs: [{ kind: "Document", definitions: [{ name: { value: "Query" } }] }],
  resolvers: { Query: { test: vi.fn() } },
}));

vi.mock("./auth/auth.util.js", () => ({
  buildHttpContext: vi.fn(),
}));

vi.mock("./auth/auth.plugin.js", () => ({
  authGatePlugin: { plugin: "authGate" },
}));

vi.mock("./plugins/gatedLandingPage.plugin.js", () => ({
  gatedLandingPagePlugin: vi.fn(() => ({ plugin: "gatedLandingPage" })),
}));

import { typeDefs, resolvers } from "./model/graphql.js";
import { buildHttpContext } from "./auth/auth.util.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { gatedLandingPagePlugin } from "./plugins/gatedLandingPage.plugin.js";

describe("local-server", () => {
  const mockApolloServer = {
    start: vi.fn(),
    stop: vi.fn(),
    executeOperation: vi.fn(),
  };

  const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    (ApolloServer as any).mockImplementation(() => mockApolloServer);
    (startStandaloneServer as any).mockResolvedValue({
      url: "http://localhost:4000/",
    });
    process.env.ALLOW_INTROSPECTION = undefined;
  });

  afterEach(() => {
    vi.resetModules();
    delete process.env.ALLOW_INTROSPECTION;
  });

  describe("ApolloServer initialization", () => {
    it("should create ApolloServer with correct configuration", async () => {
      // Import the module to trigger initialization
      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: false,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });
    });

    it("should enable introspection when ALLOW_INTROSPECTION is true", async () => {
      process.env.ALLOW_INTROSPECTION = "true";

      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: true,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });
    });

    it("should disable introspection when ALLOW_INTROSPECTION is false", async () => {
      process.env.ALLOW_INTROSPECTION = "false";

      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: false,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });
    });

    it("should disable introspection when ALLOW_INTROSPECTION is not set", async () => {
      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: false,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });
    });

    it("should include all required plugins", async () => {
      await import("./local-server.js");

      expect(gatedLandingPagePlugin).toHaveBeenCalled();
      expect(ApolloServer).toHaveBeenCalledWith(
        expect.objectContaining({
          plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
        })
      );
    });

    it("should use correct typeDefs and resolvers", async () => {
      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith(
        expect.objectContaining({
          typeDefs,
          resolvers,
        })
      );
    });
  });

  describe("startStandaloneServer configuration", () => {
    it("should start server on port 4000", async () => {
      await import("./local-server.js");

      expect(startStandaloneServer).toHaveBeenCalledWith(
        mockApolloServer,
        expect.objectContaining({
          listen: { port: 4000 },
        })
      );
    });

    it("should configure context builder", async () => {
      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      expect(callArgs).toHaveProperty("context");
      expect(typeof callArgs.context).toBe("function");
    });

    it("should call buildHttpContext with request object", async () => {
      (buildHttpContext as any).mockResolvedValue({ user: { id: "test" } });

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      const mockReq = { headers: { authorization: "Bearer token" } };
      await contextFunction({ req: mockReq });

      expect(buildHttpContext).toHaveBeenCalledWith(mockReq);
    });

    it("should return context from buildHttpContext", async () => {
      const expectedContext = { user: { id: "test", role: "admin" } };
      (buildHttpContext as any).mockResolvedValue(expectedContext);

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      const mockReq = { headers: { authorization: "Bearer token" } };
      const result = await contextFunction({ req: mockReq });

      expect(result).toEqual(expectedContext);
    });
  });

  describe("server startup", () => {
    it("should log server URL when started", async () => {
      await import("./local-server.js");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🚀 Server listening at: http://localhost:4000/"
      );
    });

    it("should handle different server URLs", async () => {
      const customUrl = "http://localhost:8080/graphql";
      (startStandaloneServer as any).mockResolvedValue({ url: customUrl });

      await import("./local-server.js");

      expect(mockConsoleLog).toHaveBeenCalledWith(
        `🚀 Server listening at: ${customUrl}`
      );
    });

    it("should await server startup", async () => {
      let resolveStartup: (value: any) => void;
      const startupPromise = new Promise((resolve) => {
        resolveStartup = resolve;
      });

      (startStandaloneServer as any).mockReturnValue(startupPromise);

      const importPromise = import("./local-server.js");

      // Verify console.log hasn't been called yet
      expect(mockConsoleLog).not.toHaveBeenCalled();

      // Resolve the startup
      resolveStartup!({ url: "http://localhost:4000/" });
      await importPromise;

      // Now console.log should have been called
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🚀 Server listening at: http://localhost:4000/"
      );
    });
  });

  describe("environment variable handling", () => {
    it("should handle various ALLOW_INTROSPECTION values", async () => {
      const testCases = [
        { value: "true", expected: true },
        { value: "TRUE", expected: false }, // Only exact "true" should work
        { value: "false", expected: false },
        { value: "1", expected: false },
        { value: "yes", expected: false },
        { value: "", expected: false },
        { value: undefined, expected: false },
      ];

      for (const testCase of testCases) {
        vi.resetModules();
        vi.clearAllMocks();
        (ApolloServer as any).mockImplementation(() => mockApolloServer);
        (startStandaloneServer as any).mockResolvedValue({
          url: "http://localhost:4000/",
        });

        if (testCase.value !== undefined) {
          process.env.ALLOW_INTROSPECTION = testCase.value;
        } else {
          delete process.env.ALLOW_INTROSPECTION;
        }

        await import("./local-server.js");

        expect(ApolloServer).toHaveBeenCalledWith(
          expect.objectContaining({
            introspection: testCase.expected,
          })
        );

        delete process.env.ALLOW_INTROSPECTION;
      }
    });
  });

  describe("error handling", () => {
    it("should handle ApolloServer constructor errors", async () => {
      const constructorError = new Error("Invalid schema");
      (ApolloServer as any).mockImplementation(() => {
        throw constructorError;
      });

      await expect(import("./local-server.js")).rejects.toThrow("Invalid schema");
    });

    it("should handle startStandaloneServer errors", async () => {
      const startupError = new Error("Port already in use");
      (startStandaloneServer as any).mockRejectedValue(startupError);

      await expect(import("./local-server.js")).rejects.toThrow("Port already in use");
    });

    it("should handle context builder errors", async () => {
      const contextError = new Error("Authentication failed");
      (buildHttpContext as any).mockRejectedValue(contextError);

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      const mockReq = { headers: { authorization: "invalid" } };

      await expect(contextFunction({ req: mockReq })).rejects.toThrow(
        "Authentication failed"
      );
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete server startup workflow", async () => {
      const mockContext = { user: { id: "user-1", role: "admin" } };
      (buildHttpContext as any).mockResolvedValue(mockContext);
      (startStandaloneServer as any).mockResolvedValue({
        url: "http://localhost:4000/graphql",
      });

      await import("./local-server.js");

      // Verify ApolloServer was created with correct config
      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: false,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });

      // Verify server was started with correct options
      expect(startStandaloneServer).toHaveBeenCalledWith(
        mockApolloServer,
        {
          listen: { port: 4000 },
          context: expect.any(Function),
        }
      );

      // Verify URL was logged
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🚀 Server listening at: http://localhost:4000/graphql"
      );

      // Test context function
      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;
      const mockReq = { headers: { authorization: "Bearer token" } };
      const result = await contextFunction({ req: mockReq });

      expect(buildHttpContext).toHaveBeenCalledWith(mockReq);
      expect(result).toEqual(mockContext);
    });

    it("should handle server startup with introspection enabled", async () => {
      process.env.ALLOW_INTROSPECTION = "true";
      const mockContext = { user: null };
      (buildHttpContext as any).mockResolvedValue(mockContext);
      (startStandaloneServer as any).mockResolvedValue({
        url: "http://localhost:4000/",
      });

      await import("./local-server.js");

      expect(ApolloServer).toHaveBeenCalledWith({
        typeDefs,
        resolvers,
        introspection: true,
        plugins: [authGatePlugin, { plugin: "gatedLandingPage" }],
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🚀 Server listening at: http://localhost:4000/"
      );
    });

    it("should handle multiple context calls", async () => {
      const contexts = [
        { user: { id: "user-1", role: "admin" } },
        { user: { id: "user-2", role: "user" } },
        { user: null },
      ];

      (buildHttpContext as any)
        .mockResolvedValueOnce(contexts[0])
        .mockResolvedValueOnce(contexts[1])
        .mockResolvedValueOnce(contexts[2]);

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      const requests = [
        { headers: { authorization: "Bearer admin-token" } },
        { headers: { authorization: "Bearer user-token" } },
        { headers: {} },
      ];

      for (let i = 0; i < requests.length; i++) {
        const result = await contextFunction({ req: requests[i] });
        expect(result).toEqual(contexts[i]);
      }

      expect(buildHttpContext).toHaveBeenCalledTimes(3);
    });
  });

  describe("configuration validation", () => {
    it("should use correct port number", async () => {
      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      expect(callArgs.listen.port).toBe(4000);
    });

    it("should include required plugins in correct order", async () => {
      await import("./local-server.js");

      const callArgs = (ApolloServer as any).mock.calls[0][0];
      expect(callArgs.plugins).toHaveLength(2);
      expect(callArgs.plugins[0]).toBe(authGatePlugin);
      expect(callArgs.plugins[1]).toEqual({ plugin: "gatedLandingPage" });
    });

    it("should call gatedLandingPagePlugin factory function", async () => {
      await import("./local-server.js");

      expect(gatedLandingPagePlugin).toHaveBeenCalledWith();
      expect(gatedLandingPagePlugin).toHaveBeenCalledTimes(1);
    });
  });

  describe("memory and performance", () => {
    it("should handle rapid server restarts", async () => {
      for (let i = 0; i < 5; i++) {
        vi.resetModules();
        vi.clearAllMocks();
        (ApolloServer as any).mockImplementation(() => mockApolloServer);
        (startStandaloneServer as any).mockResolvedValue({
          url: `http://localhost:400${i}/`,
        });

        await import("./local-server.js");

        expect(ApolloServer).toHaveBeenCalledTimes(1);
        expect(startStandaloneServer).toHaveBeenCalledTimes(1);
        expect(mockConsoleLog).toHaveBeenCalledWith(
          `🚀 Server listening at: http://localhost:400${i}/`
        );
      }
    });

    it("should handle large context objects", async () => {
      const largeContext = {
        user: {
          id: "user-1",
          permissions: new Array(1000).fill("permission"),
          metadata: {
            largeData: new Array(10000).fill("data").join(""),
          },
        },
      };

      (buildHttpContext as any).mockResolvedValue(largeContext);

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;
      const mockReq = { headers: { authorization: "Bearer token" } };
      const result = await contextFunction({ req: mockReq });

      expect(result).toEqual(largeContext);
      expect(result.user.permissions).toHaveLength(1000);
    });
  });

  describe("edge cases", () => {
    it("should handle missing request object", async () => {
      (buildHttpContext as any).mockResolvedValue({ user: null });

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      await contextFunction({ req: undefined });

      expect(buildHttpContext).toHaveBeenCalledWith(undefined);
    });

    it("should handle null request object", async () => {
      (buildHttpContext as any).mockResolvedValue({ user: null });

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      await contextFunction({ req: null });

      expect(buildHttpContext).toHaveBeenCalledWith(null);
    });

    it("should handle empty context object", async () => {
      (buildHttpContext as any).mockResolvedValue({});

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;
      const mockReq = { headers: {} };
      const result = await contextFunction({ req: mockReq });

      expect(result).toEqual({});
    });

    it("should handle context function called without parameters", async () => {
      (buildHttpContext as any).mockResolvedValue({ user: null });

      await import("./local-server.js");

      const callArgs = (startStandaloneServer as any).mock.calls[0][1];
      const contextFunction = callArgs.context;

      await contextFunction({});

      expect(buildHttpContext).toHaveBeenCalledWith(undefined);
    });
  });
});