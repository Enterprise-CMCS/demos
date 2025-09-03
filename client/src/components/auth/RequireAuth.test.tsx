import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render } from "@testing-library/react";
import { RequireAuth } from "./RequireAuth";
import { useAuth as useAuthMock } from "react-oidc-context";

// Mock react-oidc-context
vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn(),
}));

describe("RequireAuth", () => {
  const children = <div>Protected Content</div>;
  let signinRedirect: Mock;

  beforeEach(() => {
    signinRedirect = vi.fn().mockResolvedValue(undefined);
    sessionStorage.clear();
    (useAuthMock as unknown as Mock).mockReset();
  });

  it("renders children when authenticated and not processing", () => {
    (useAuthMock as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      activeNavigator: undefined,
      signinRedirect,
    });

    const { queryByText } = render(<RequireAuth>{children}</RequireAuth>);
    expect(queryByText("Protected Content")).toBeInTheDocument();
  });

  it("returns null when processing", () => {
    (useAuthMock as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: true,
      activeNavigator: undefined,
      signinRedirect,
    });

    const { container } = render(<RequireAuth>{children}</RequireAuth>);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when not authenticated", () => {
    (useAuthMock as unknown as Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      signinRedirect,
    });

    const { container } = render(<RequireAuth>{children}</RequireAuth>);
    expect(container.firstChild).toBeNull();
  });

  it("calls signinRedirect when not authenticated and not processing", () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      signinRedirect,
    });

    render(<RequireAuth>{children}</RequireAuth>);
    expect(signinRedirect).toHaveBeenCalledWith({
      state: { returnUrl: window.location.pathname + window.location.search },
    });
  });

  it("does not call signinRedirect if just logged out", () => {
    sessionStorage.setItem("justLoggedOut", "1");
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      activeNavigator: undefined,
      signinRedirect,
    });

    render(<RequireAuth>{children}</RequireAuth>);
    expect(signinRedirect).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("justLoggedOut")).toBeNull();
  });
});
