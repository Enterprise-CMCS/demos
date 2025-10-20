// DemosApolloProvider.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DemosApolloProvider } from "./DemosApolloProvider";
import type { ApolloLink } from "@apollo/client";

// ---- Fix the env mock: include isLocalDevelopment and shouldUseMocks ----
vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    // default: not local; can override in tests
    isLocalDevelopment: vi.fn(() => false),
    // default: use mocks; tests flip this to false when needed
    shouldUseMocks: vi.fn(() => true),
    // default: don't bypass auth; can override in tests
    shouldBypassAuth: vi.fn(() => false),
  };
});

type MockAuth = { user: { access_token?: string; id_token?: string } | null };

// react-oidc-context mock
vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(() => ({
    user: {
      access_token: "mock-access-token-123",
      id_token: "mock-id-token-123",
    },
  })),
}));

// @apollo/client & link/context mocks
vi.mock("@apollo/client", () => ({
  ApolloClient: vi.fn(),
  InMemoryCache: vi.fn(() => ({})),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  createHttpLink: vi.fn(() => ({ kind: "httpLink" }) as object),
  gql: vi.fn(),
  useQuery: vi.fn(() => ({ data: undefined, error: undefined, loading: false })),
}));

vi.mock("@apollo/client/link/context", () => ({
  setContext: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DemosApolloProvider", () => {
  it("configures Apollo Client with auth headers when not using mocks", async () => {
    const { shouldUseMocks } = await import("config/env");
    vi.mocked(shouldUseMocks).mockReturnValue(false); // force real client

    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    // make auth link that supports concat
    const mockAuthLink = { concat: vi.fn(() => "combined-link") } as unknown as ApolloLink;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    type Headers = Record<string, string>;
    type SetContextFn = (
      op: { query: unknown },
      ctx: { headers?: Headers }
    ) => { headers: Headers };
    const authHeaderFn = mockSetContext.mock.calls[0][0] as SetContextFn;
    const result = authHeaderFn(
      { query: "test" },
      { headers: { "Content-Type": "application/json" } }
    );

    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-id-token-123",
      },
    });
  });

  it("handles missing auth token gracefully", async () => {
    const { shouldUseMocks } = await import("config/env");
    vi.mocked(shouldUseMocks).mockReturnValue(false); // force real client

    const { useAuth } = await import("react-oidc-context");
    const mockedUseAuth = vi.mocked(useAuth as unknown as () => MockAuth);
    mockedUseAuth.mockReturnValue({ user: null });

    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    const mockAuthLink = { concat: vi.fn(() => "combined-link") } as unknown as ApolloLink;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    const authHeaderFn = mockSetContext.mock.calls[0][0] as (
      op: { query: unknown },
      ctx: { headers?: Record<string, string> }
    ) => { headers: Record<string, string> };
    const result = authHeaderFn(
      { query: "test" },
      { headers: { "Content-Type": "application/json" } }
    );

    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("skips auth headers when bypassing authentication", async () => {
    const { shouldUseMocks, shouldBypassAuth } = await import("config/env");
    vi.mocked(shouldUseMocks).mockReturnValue(false); // force real client
    vi.mocked(shouldBypassAuth).mockReturnValue(true); // bypass auth

    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    const mockAuthLink = { concat: vi.fn(() => "combined-link") } as unknown as ApolloLink;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    const authHeaderFn = mockSetContext.mock.calls[0][0] as (
      op: { query: unknown },
      ctx: { headers?: Record<string, string> }
    ) => { headers: Record<string, string> };
    const result = authHeaderFn(
      { query: "test" },
      { headers: { "Content-Type": "application/json" } }
    );

    // Should not add Authorization header when bypassing
    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});
