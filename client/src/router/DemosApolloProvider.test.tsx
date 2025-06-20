import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemosApolloProvider } from "./DemosApolloProvider";

vi.mock("config/env", () => ({
  isDevelopmentMode: vi.fn(),
  shouldUseMocks: vi.fn(() => true),
  getAppMode: vi.fn(() => "development"),
}));

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: vi.fn(() => ({
    user: {
      access_token: "mock-access-token-123",
    },
  })),
}));

vi.mock("@apollo/client", () => ({
  ApolloClient: vi.fn(),
  InMemoryCache: vi.fn(() => ({})),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  createHttpLink: vi.fn(),
  gql: vi.fn(),
  useQuery: vi.fn(() => ({
    data: undefined,
    error: undefined,
    loading: false,
  })),
}));

vi.mock("@apollo/client/link/context", () => ({
  setContext: vi.fn(),
}));

describe("DemosApolloProvider", () => {
  it("configures Apollo Client with auth headers when not using mocks", async () => {
    // Mock shouldUseMocks to return false so we use real Apollo Client
    const { shouldUseMocks } = await import("config/env");
    vi.mocked(shouldUseMocks).mockReturnValue(false);

    // Import and get access to the mocked functions
    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    // Mock the auth link that setContext returns
    const mockAuthLink = {
      concat: vi.fn(() => "combined-link"),
    } as unknown as ReturnType<typeof setContext>;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    // Verify setContext was called to set up auth headers
    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    // Get the auth header function that was passed to setContext
    const authHeaderFunction = mockSetContext.mock.calls[0][0];

    // Test that the auth header function returns the correct headers
    const result = authHeaderFunction(
      { query: "test" } as unknown as Parameters<typeof authHeaderFunction>[0],
      { headers: { "Content-Type": "application/json" } }
    );

    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-access-token-123",
      },
    });
  });

  it("handles missing auth token gracefully", async () => {
    // Mock shouldUseMocks to return false so we use real Apollo Client
    const { shouldUseMocks } = await import("config/env");
    vi.mocked(shouldUseMocks).mockReturnValue(false);

    // Clear the existing mock and set up new mock for useAuth to return no user/token
    const { useAuth } = await import("react-oidc-context");
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
    } as unknown as ReturnType<typeof useAuth>);

    // Import and get access to the mocked functions
    const { setContext } = await import("@apollo/client/link/context");
    const mockSetContext = vi.mocked(setContext);

    // Mock the auth link that setContext returns
    const mockAuthLink = {
      concat: vi.fn(() => "combined-link"),
    } as unknown as ReturnType<typeof setContext>;
    mockSetContext.mockReturnValue(mockAuthLink);

    render(<DemosApolloProvider>Hello</DemosApolloProvider>);

    // Verify setContext was called to set up auth headers
    expect(mockSetContext).toHaveBeenCalledWith(expect.any(Function));

    // Get the auth header function that was passed to setContext
    const authHeaderFunction = mockSetContext.mock.calls[0][0];

    // Test that the auth header function handles missing token gracefully
    const result = authHeaderFunction(
      { query: "test" } as unknown as Parameters<typeof authHeaderFunction>[0],
      { headers: { "Content-Type": "application/json" } }
    );

    // Should return headers without Authorization when no token is present
    expect(result).toEqual({
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});
