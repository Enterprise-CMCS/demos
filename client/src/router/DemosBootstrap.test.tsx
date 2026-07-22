import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DemosBootstrap } from "./DemosBootstrap";

vi.mock("./DemosAuthProvider", () => ({
  DemosAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("./RequireAuthentication", () => ({
  RequireAuthentication: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-authentication">{children}</div>
  ),
}));

vi.mock("./DemosApolloProvider", () => ({
  DemosApolloProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="apollo-provider">{children}</div>
  ),
}));

vi.mock("components/user/UserProvider", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
}));

vi.mock("./DemosRouter", () => ({
  DemosRouter: () => <div data-testid="router-content">router content</div>,
}));

describe("DemosBootstrap", () => {
  it("renders the startup stack in the expected order around the router", () => {
    render(<DemosBootstrap />);

    const authProvider = screen.getByTestId("auth-provider");
    const requireAuthentication = screen.getByTestId("require-authentication");
    const apolloProvider = screen.getByTestId("apollo-provider");
    const userProvider = screen.getByTestId("user-provider");
    const routerContent = screen.getByTestId("router-content");

    expect(authProvider).toContainElement(requireAuthentication);
    expect(requireAuthentication).toContainElement(apolloProvider);
    expect(apolloProvider).toContainElement(userProvider);
    expect(userProvider).toContainElement(routerContent);
    expect(routerContent).toHaveTextContent("router content");
  });
});
