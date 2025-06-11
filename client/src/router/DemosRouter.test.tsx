import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemosRouter } from "./DemosRouter";

// Mock react-oidc-context AuthProvider to just render children
vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Apollo MockedProvider to just render children
vi.mock("@apollo/client/testing", () => ({
  MockedProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock getCognitoConfig to return an empty object
vi.mock("./cognitoConfig", () => ({
  getCognitoConfig: () => ({}),
}));

// Mock pages and components
// TODO: Ideally we remove these mocks and use the actual components
// but for now we just return divs to have something to match on
vi.mock("pages", () => ({
  LandingPage: () => <div>LandingPage</div>,
}));
vi.mock("pages/debug", () => ({
  ComponentLibrary: () => <div>ComponentLibrary</div>,
  TestHooks: () => <div>TestHooks</div>,
}));
vi.mock("components/auth/AuthComponent", () => ({
  AuthComponent: () => <div>AuthComponent</div>,
}));
vi.mock("layout/PrimaryLayout", () => ({
  PrimaryLayout: ({ children }: { children: React.ReactNode }) => (
    <div>PrimaryLayout{children}</div>
  ),
}));
vi.mock("pages/Demonstrations", () => ({
  Demonstrations: () => <div>Demonstrations</div>,
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
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.getByText("ComponentLibrary")).toBeInTheDocument();

    window.history.pushState({}, "Hooks", "/hooks");
    render(<DemosRouter />);
    expect(screen.getByText("TestHooks")).toBeInTheDocument();

    window.history.pushState({}, "Auth", "/auth");
    render(<DemosRouter />);
    expect(screen.getByText("AuthComponent")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("does not render debug routes outside development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    window.history.pushState({}, "Components", "/components");
    render(<DemosRouter />);
    expect(screen.queryByText("ComponentLibrary")).not.toBeInTheDocument();
    process.env.NODE_ENV = originalEnv;
  });
});
