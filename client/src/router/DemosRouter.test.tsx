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
    isMockUnauthenticated: vi.fn(() => false),
  };
});

vi.mock("components", () => ({
  Footer: () => <div>Footer</div>,
}));

vi.mock("components/user/UserContext", () => ({
  getCurrentUser: () => ({ currentUser: currentUserState.currentUser }),
}));

vi.mock("components/user/UserProvider", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    <MockedProvider mocks={[]}>{children}</MockedProvider>
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
vi.mock("layout/Layout", async () => {
  const React = (await import("react")).default;
  const { Outlet } = await import("react-router-dom");

  return {
    Layout: ({
      headerLower,
      sideNav,
      footer,
      children,
    }: {
      headerLower?: React.ReactNode;
      sideNav?: React.ReactNode;
      footer?: React.ReactNode;
      children?: React.ReactNode;
    }) => (
      <div>
        Layout
        {(sideNav || footer) && <div>Header</div>}
        {sideNav}
        {footer}
        {(sideNav || footer) && headerLower}
        {children ?? <Outlet />}
      </div>
    ),
  };
});
vi.mock("layout/SideNav", () => ({
  SideNav: () => <div>SideNav</div>,
}));
vi.mock("components/header/DefaultHeaderLower", () => ({
  DefaultHeaderLower: () => <div>DefaultHeaderLower</div>,
}));
vi.mock("pages/DemonstrationDetail/DemonstrationDetailHeader", () => ({
  DemonstrationDetailHeader: ({ demonstrationId }: { demonstrationId: string }) => (
    <div>DemonstrationDetailHeader:{demonstrationId}</div>
  ),
  DemonstrationDetailRouteHeader: () => <div>DemonstrationDetailHeader:demo-1</div>,
}));
vi.mock("pages/deliverables/DeliverableDetailHeader", () => ({
  DeliverableDetailHeader: ({ deliverableId }: { deliverableId: string }) => (
    <div>DeliverableDetailHeader:{deliverableId}</div>
  ),
  DeliverableDetailRouteHeader: () => <div>DeliverableDetailHeader:deliv-1</div>,
}));
vi.mock("pages/admin/AdminHeader", () => ({
  AdminHeader: () => <div>AdminHeader</div>,
}));
vi.mock("pages/references/ReferencesHeader", () => ({
  ReferencesHeader: () => <div>ReferencesHeader</div>,
}));
vi.mock("pages/DemonstrationsPage", () => ({
  DemonstrationsPage: () => <div>DemonstrationsPage</div>,
  DEMONSTRATIONS_PAGE_QUERY: {},
}));
vi.mock("pages/DemonstrationDetail/index", () => ({
  DemonstrationDetail: () => <div>DemonstrationDetail</div>,
}));
vi.mock("pages/DeliverablesPage", () => ({
  DeliverablesPage: () => <div>DeliverablesPage</div>,
}));
vi.mock("pages/deliverables/DeliverableDetailsManagementPage", () => ({
  DeliverableDetailsManagementPage: () => <div>DeliverableDetailsManagementPage</div>,
}));
vi.mock("pages/ReportsPage", () => ({
  ReportsPage: () => <div>ReportsPage</div>,
}));
vi.mock("pages/admin/AdminPage", () => ({
  AdminPage: () => <div>AdminPage</div>,
}));
vi.mock("pages/references/ReferencesPage", () => ({
  ReferencesPage: () => <div>ReferencesPage</div>,
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
    await waitFor(() => expect(screen.getByText("Layout")).toBeInTheDocument());
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("DefaultHeaderLower")).toBeInTheDocument();
    expect(screen.getByText("SideNav")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the DeliverablesPage at root path for state users", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Home", "/");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the Deliverables page with the sidebar for CMS users", async () => {
    currentUserState.currentUser.person.personType = "demos-cms-user";
    window.history.pushState({}, "Deliverables", "/deliverables");
    render(<DemosRouter />);

    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.getByText("SideNav")).toBeInTheDocument();
  });

  it("renders the Demonstrations page at /demonstrations", async () => {
    window.history.pushState({}, "Demonstrations", "/demonstrations");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DemonstrationsPage")).toBeInTheDocument());
    expect(screen.getByText("SideNav")).toBeInTheDocument();
  });

  it("redirects state users from /demonstrations to their deliverables home page", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Demonstrations", "/demonstrations");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.queryByText("DemonstrationsPage")).not.toBeInTheDocument();
  });

  it("redirects state users from demonstration detail URLs to their deliverables home page", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Demonstration Detail", "/demonstrations/demo-1");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.queryByText("DemonstrationDetail")).not.toBeInTheDocument();
  });

  it("renders the demonstration detail header on demonstration detail routes", async () => {
    window.history.pushState({}, "Demonstration Detail", "/demonstrations/demo-1");
    render(<DemosRouter />);

    await waitFor(() => expect(screen.getByText("DemonstrationDetail")).toBeInTheDocument());
    expect(screen.getAllByText("Layout")).toHaveLength(1);
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("DemonstrationDetailHeader:demo-1")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the Deliverables page at /deliverables", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Deliverables", "/deliverables");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
  });

  it("renders the deliverable detail header on deliverable detail routes", async () => {
    window.history.pushState({}, "Deliverable Detail", "/deliverables/deliv-1");
    render(<DemosRouter />);

    await waitFor(() =>
      expect(screen.getByText("DeliverableDetailsManagementPage")).toBeInTheDocument()
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("DeliverableDetailHeader:deliv-1")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the Reports page at /reports", async () => {
    window.history.pushState({}, "Reports", "/reports");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("ReportsPage")).toBeInTheDocument());
    expect(screen.getByText("SideNav")).toBeInTheDocument();
  });

  it("redirects state users from /reports to their deliverables home page", async () => {
    currentUserState.currentUser.person.personType = "demos-state-user";
    window.history.pushState({}, "Reports", "/reports");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("DeliverablesPage")).toBeInTheDocument());
    expect(screen.queryByText("ReportsPage")).not.toBeInTheDocument();
  });

  it("renders the References page at /references", async () => {
    window.history.pushState({}, "References", "/references");
    render(<DemosRouter />);
    await waitFor(() => expect(screen.getByText("ReferencesPage")).toBeInTheDocument());
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("ReferencesHeader")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the admin header on admin routes", async () => {
    window.history.pushState({}, "Admin", "/admin");
    render(<DemosRouter />);

    await waitFor(() => expect(screen.getByText("AdminHeader")).toBeInTheDocument());
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("AdminPage")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
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
