// DemosApolloProvider.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { gql, useQuery } from "@apollo/client";

// We'll import the module under test *after* setting up our mocks in each case
// so we can control env + module-level side effects.

// A tiny component that issues a simple query through whatever provider it's wrapped with
const PING_QUERY = gql`
  query Ping {
    ping
  }
`;

function PingConsumer() {
  const { data, loading, error } = useQuery(PING_QUERY);
  if (loading) return <div>loading...</div>;
  if (error) return <div>error: {String(error)}</div>;
  return <div data-testid="result">{data?.ping}</div>;
}

const mockAuthWithToken = {
  isAuthenticated: true,
  user: { id_token: "abc123" },
} as any;

const mockAuthWithoutToken = {
  isAuthenticated: false,
  user: undefined,
} as any;

const setupImportMetaEnv = (url: string) => {
  // Ensure import.meta.env exists before importing the provider file
  (globalThis as any).importMetaEnvBackup = (import.meta as any).env;
  (import.meta as any).env = { ...(import.meta as any).env, VITE_API_URL_PREFIX: url };
};

const restoreImportMetaEnv = () => {
  if ((globalThis as any).importMetaEnvBackup) {
    (import.meta as any).env = (globalThis as any).importMetaEnvBackup;
    delete (globalThis as any).importMetaEnvBackup;
  }
};

describe("DemosApolloProvider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    restoreImportMetaEnv();
  });

  it("uses MockedProvider when shouldUseMocks() is true and returns mocked data", async () => {
    // Arrange module mocks for this test
    vi.doMock("config/env", () => ({
      shouldUseMocks: () => true,
      isProductionMode: () => false,
    }));

    // Provide a mock set for the ALL_MOCKS import
    const mockedResponse = { data: { ping: "ok-from-mocks" } };
    vi.doMock("mock-data", () => ({
      ALL_MOCKS: [
        {
          request: { query: PING_QUERY },
          result: mockedResponse,
        },
      ],
    }));

    // Mock react-oidc-context, though it won't be used in mocks mode
    vi.doMock("react-oidc-context", () => ({
      useAuth: () => mockAuthWithToken,
    }));

    // Import after mocks are in place
    const { DemosApolloProvider } = await import("./DemosApolloProvider");

    // Act
    render(
      <DemosApolloProvider>
        <PingConsumer />
      </DemosApolloProvider>
    );

    // Assert
    expect(await screen.findByTestId("result")).toHaveTextContent("ok-from-mocks");
  });

  it("uses ApolloProvider when shouldUseMocks() is false and sends Authorization header if token exists", async () => {
    // Arrange env + module mocks
    setupImportMetaEnv("http://example.test/graphql");

    vi.doMock("config/env", () => ({
      shouldUseMocks: () => false,
      isProductionMode: () => false,
    }));

    // Make sure ALL_MOCKS isn't used on this path
    vi.doMock("mock-data", () => ({ ALL_MOCKS: [] }));

    // Mock useAuth to provide a token
    vi.doMock("react-oidc-context", () => ({
      useAuth: () => mockAuthWithToken,
    }));

    // Mock fetch to capture headers and return data
    const fetchSpy = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      // Basic check: GraphQL requests are POST with JSON body containing the query
      const headers = new Headers(init?.headers as any);
      const auth = headers.get("authorization") || headers.get("Authorization");
      expect(auth).toBe("Bearer abc123"); // key assertion for this test

      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
      if (body?.query?.includes("query Ping")) {
        return new Response(JSON.stringify({ data: { ping: "ok-live" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ errors: [{ message: "Unknown query" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    global.fetch = fetchSpy;

    const { DemosApolloProvider } = await import("./DemosApolloProvider");

    // Act
    render(
      <DemosApolloProvider>
        <PingConsumer />
      </DemosApolloProvider>
    );

    // Assert
    expect(await screen.findByTestId("result")).toHaveTextContent("ok-live");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("omits Authorization header when no token is present", async () => {
    setupImportMetaEnv("http://example.test/graphql");
    const envMod = await import("config/env");
    vi.spyOn(envMod, "isDevelopmentMode").mockReturnValue(true);
    vi.doMock("config/env", () => ({
      shouldUseMocks: () => false,
      isProductionMode: () => false,
    }));

    vi.doMock("mock-data", () => ({ ALL_MOCKS: [] }));

    // No token this time
    vi.doMock("react-oidc-context", () => ({
      useAuth: () => mockAuthWithoutToken,
    }));

    const fetchSpy = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers as any);
      // Should not include Authorization at all
      expect(headers.has("authorization") || headers.has("Authorization")).toBe(false);

      return new Response(JSON.stringify({ data: { ping: "ok-live-no-auth" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    // @ts-expect-error override
    global.fetch = fetchSpy;

    const { DemosApolloProvider } = await import("./DemosApolloProvider");

    render(
      <DemosApolloProvider>
        <PingConsumer />
      </DemosApolloProvider>
    );

    expect(await screen.findByTestId("result")).toHaveTextContent("ok-live-no-auth");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
