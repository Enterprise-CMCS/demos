// DemosApolloProvider.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DemosApolloProvider } from "./DemosApolloProvider";

// ---- Fix the env mock: include isLocalDevelopment and shouldUseMocks ----
vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    // default: not local; can override in tests
    isLocalDevelopment: vi.fn(() => false),
    // default: use mocks; tests flip this to false when needed
    shouldUseMocks: vi.fn(() => true),
  };
});

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
  createHttpLink: vi.fn(() => ({ kind: "httpLink" } as any)),
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
    const mockAuthLink = { concat: vi.fn(() => "combined-link") } as any;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    const authHeaderFn = mockSetContext.mock.calls[0][0];
    const result = authHeaderFn(
      { query: "test" } as any,
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
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    const mockAuthLink = { concat: vi.fn(() => "combined-link") } as any;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    const authHeaderFn = mockSetContext.mock.calls[0][0];
    const result = authHeaderFn(
      { query: "test" } as any,
      { headers: { "Content-Type": "application/json" } }
    );

    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});
