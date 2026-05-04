import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi, Mock } from "vitest";
import { DemosRouter } from "./DemosRouter";
import * as envMod from "config/env";

const { currentUserState } = vi.hoisted(() => ({
  currentUserState: {
    currentUser: {
      id: "user-1",
      username: "test.user",
      person: {
        id: "person-1",
        firstName: "Test",
        lastName: "User",
        fullName: "Test User",
        email: "test.user@example.com",
        personType: "demos-cms-user",
      },
    },
  },
}));

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    getAppMode: vi.fn(() => "test"),
    isLocalDevelopment: vi.fn(() => false),
    shouldUseMocks: vi.fn(() => true),
  };
});

vi.mock("components/user/UserContext", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  getCurrentUser: () => ({ currentUser: currentUserState.currentUser }),
}));

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
  const DemosApolloProvider = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  );
  return { DemosApolloProvider };
});

vi.mock("pages/debug", () => ({
  ComponentLibrary: () => <div>ComponentLibrary</div>,
  TestHooks: () => <div>TestHooks</div>,
  DialogSandbox: () => <div>DialogSandbox</div>,
}));
vi.mock("pages/debug/AuthDebugComponent", () => ({
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
vi.mock("pages/DeliverablesPage", () => ({
  DeliverablesPage: () => <div>DeliverablesPage</div>,
}));

describe("DemosRouter", () => {
  beforeEach(() => {
    currentUserState.currentUser.person.personType = "demos-cms-user";
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(false);
  });

  it("renders the DemonstrationsPage at root path for CMS users", async () => {
    window.history.pushState({}, "Home", "/");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DemonstrationsPage")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("PrimaryLayout")).toBeInTheDocument());
  });

  it("renders the DeliverablesPage at root path for state users", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Home", "/");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
  });

  it("renders the Demonstrations page at /demonstrations", async () => {
    window.history.pushState({}, "Demonstrations", "/demonstrations");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DemonstrationsPage")).toBeInTheDocument());
  });

  it("renders the Deliverables page at /deliverables", async () => {
    window.history.pushState({}, "Deliverables", "/deliverables");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
  });

  it("renders component debug routes in development mode", async () => {
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(true);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("ComponentLibrary")).toBeInTheDocument());
  });

  it("renders auth debug routes in development mode", async () => {
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(true);
    window.history.pushState({}, "Auth", "/auth");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("AuthDebugComponent")).toBeInTheDocument());
  });

  it("does not render debug routes outside development mode", () => {
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(false);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.queryByText("ComponentLibrary")).not.toBeInTheDocument();
  });
});
