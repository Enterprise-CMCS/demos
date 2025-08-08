import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemosRouter } from "./DemosRouter";

<<<<<<< HEAD
vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    shouldUseMocks: vi.fn(() => false),
    isProductionMode: vi.fn(() => false),
  };
});
=======
vi.mock("config/env", () => ({
  isLocalDevelopment: vi.fn(),
  shouldUseMocks: vi.fn(() => true),
}));
>>>>>>> main

// Mock react-oidc-context AuthProvider to just render children
vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(() => ({})),
}));

// Mock Apollo MockedProvider to just render children
vi.mock("@apollo/client/testing", () => ({
  MockedProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
});
