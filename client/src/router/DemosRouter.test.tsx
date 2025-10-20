import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, Mock } from "vitest";
import { DemosRouter } from "./DemosRouter";
import * as envMod from "config/env";

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    getAppMode: vi.fn(() => "test"),
    isLocalDevelopment: vi.fn(() => false),
    shouldUseMocks: vi.fn(() => true),
    shouldBypassAuth: vi.fn(() => false),
  };
});

vi.mock("react-oidc-context", () => {
  const signinRedirect = vi.fn();
  const signoutRedirect = vi.fn();
  const removeUser = vi.fn();
  const revokeTokens = vi.fn();

  // Simple passthrough HOC so routes render without real auth logic

  type WithAuthenticationRequired = <P extends object>(
    Component: React.ComponentType<P>,
    options?: unknown
  ) => React.ComponentType<P>;

  const withAuthenticationRequired: WithAuthenticationRequired = (Component) => {
    const Wrapped: React.FC<React.ComponentProps<typeof Component>> = (props) => (
      <Component {...props} />
    );

    // Readable display name without using `any`
    const named = Component as { displayName?: string; name?: string };
    Wrapped.displayName = `withAuthenticationRequired(${named.displayName ?? named.name ?? "Component"})`;

    return Wrapped;
  };

  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    withAuthenticationRequired,
    useAuth: () => ({
      isAuthenticated: true, // so protected routes render
      isLoading: false,
      user: { id_token: "fake" },
      signinRedirect,
      signoutRedirect,
      removeUser,
      revokeTokens,
      activeNavigator: undefined,
    }),
  };
});

vi.mock("./DemosApolloProvider", async () => {
  const React = (await import("react")).default;
  const { MockedProvider } = await import("@apollo/client/testing");
  const { userMocks } = await import("mock-data/userMocks");
  const DemosApolloProvider = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={userMocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
  return { DemosApolloProvider };
});

vi.mock("pages/debug", () => ({
  ComponentLibrary: () => <div>ComponentLibrary</div>,
  TestHooks: () => <div>TestHooks</div>,
}));
vi.mock("components/auth/AuthDebugComponent", () => ({
  AuthDebugComponent: () => <div>AuthDebugComponent</div>,
}));
vi.mock("layout/PrimaryLayout", () => ({
  PrimaryLayout: ({ children }: { children: React.ReactNode }) => (
    <div>PrimaryLayout{children}</div>
  ),
}));
vi.mock("pages/DemonstrationsPage", () => ({
  DemonstrationsPage: () => <div>DemonstrationsPage</div>,
  DEMONSTRATIONS_PAGE_QUERY: {},
}));

describe("DemosRouter", () => {
  it("renders the DemonstrationsPage at root path", () => {
    window.history.pushState({}, "Home", "/");
    render(<DemosRouter />);
    expect(screen.getByText("DemonstrationsPage")).toBeInTheDocument();
    expect(screen.getByText("PrimaryLayout")).toBeInTheDocument();
  });

  it("renders the Demonstrations page at /demonstrations", () => {
    window.history.pushState({}, "Demonstrations", "/demonstrations");
    render(<DemosRouter />);
    expect(screen.getByText("DemonstrationsPage")).toBeInTheDocument();
  });

  it("renders debug routes in development mode", () => {
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(true);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.getByText("ComponentLibrary")).toBeInTheDocument();

    window.history.pushState({}, "Auth", "/auth");
    render(<DemosRouter />);
    expect(screen.getByText("AuthDebugComponent")).toBeInTheDocument();
  });

  it("does not render debug routes outside development mode", () => {
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(false);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.queryByText("ComponentLibrary")).not.toBeInTheDocument();
  });
});
