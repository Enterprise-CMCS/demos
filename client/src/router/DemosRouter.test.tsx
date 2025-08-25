import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemosRouter } from "./DemosRouter";
import * as envMod from "config/env";


vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    getAppMode: vi.fn(() => "test"),
    isLocalDevelopment: vi.fn(() => false),
    shouldUseMocks: vi.fn(() => true),
  };
});

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(() => ({})),
}));

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

vi.mock("pages", () => ({ LandingPage: () => <div>LandingPage</div> }));
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
vi.mock("pages/Demonstrations", () => ({
  Demonstrations: () => <div>Demonstrations</div>,
  DEMONSTRATIONS_PAGE_QUERY: {},
}));

describe("DemosRouter", () => {
  it("renders the LandingPage at root path", () => {
    window.history.pushState({}, "Home", "/");
    render(<DemosRouter />);
    expect(screen.getByText("LandingPage")).toBeInTheDocument();
    expect(screen.getByText("PrimaryLayout")).toBeInTheDocument();
  });

  it("renders the Demonstrations page at /demonstrations", () => {
    window.history.pushState({}, "Demonstrations", "/demonstrations");
    render(<DemosRouter />);
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
  });

  it("renders debug routes in development mode", () => {
    (envMod.isLocalDevelopment as unknown as vi.Mock).mockReturnValue(true);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.getByText("ComponentLibrary")).toBeInTheDocument();

    window.history.pushState({}, "Hooks", "/hooks");
    render(<DemosRouter />);
    expect(screen.getByText("TestHooks")).toBeInTheDocument();

    window.history.pushState({}, "Auth", "/auth");
    render(<DemosRouter />);
    expect(screen.getByText("AuthDebugComponent")).toBeInTheDocument();
  });

  it("does not render debug routes outside development mode", () => {
    (envMod.isLocalDevelopment as unknown as vi.Mock).mockReturnValue(false);

    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.queryByText("ComponentLibrary")).not.toBeInTheDocument();
  });
});
