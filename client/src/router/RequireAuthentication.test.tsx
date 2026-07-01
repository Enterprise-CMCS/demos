import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as envMod from "config/env";
import { RequireAuthentication } from "./RequireAuthentication";

const { authState, withAuthWrapper } = vi.hoisted(() => ({
  authState: {
    error: undefined as Error | undefined,
    user: { profile: { name: "Jane Doe", email: "jane@example.com" } },
  },
  withAuthWrapper: vi.fn(),
}));

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    shouldUseMocks: vi.fn(() => false),
  };
});

vi.mock("react-oidc-context", () => {
  type WithAuthenticationRequired = <P extends object>(
    Component: React.ComponentType<P>,
    options?: unknown
  ) => React.ComponentType<P>;

  const withAuthenticationRequired: WithAuthenticationRequired = (Component) => {
    const Wrapped: React.FC<React.ComponentProps<typeof Component>> = (props) => {
      withAuthWrapper();
      return (
        <div data-testid="auth-gate-wrapper">
          <Component {...props} />
        </div>
      );
    };

    return Wrapped;
  };

  return {
    useAuth: () => authState,
    withAuthenticationRequired,
  };
});

describe("RequireAuthentication", () => {
  beforeEach(() => {
    authState.error = undefined;
    authState.user = { profile: { name: "Jane Doe", email: "jane@example.com" } };
    withAuthWrapper.mockReset();
  });

  it("renders auth failure details when auth has an error", () => {
    authState.error = new Error("Auth session expired");

    render(
      <RequireAuthentication>
        <div>app content</div>
      </RequireAuthentication>
    );

    expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Auth session expired/)).toBeInTheDocument();
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(withAuthWrapper).not.toHaveBeenCalled();
  });

  it("bypasses withAuthenticationRequired when using mocks", () => {
    vi.mocked(envMod.shouldUseMocks).mockReturnValue(true);

    render(
      <RequireAuthentication>
        <div>app content</div>
      </RequireAuthentication>
    );

    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-gate-wrapper")).not.toBeInTheDocument();
    expect(withAuthWrapper).not.toHaveBeenCalled();
  });

  it("renders children through withAuthenticationRequired outside mock mode", () => {
    vi.mocked(envMod.shouldUseMocks).mockReturnValue(false);

    render(
      <RequireAuthentication>
        <div>app content</div>
      </RequireAuthentication>
    );

    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(screen.getByTestId("auth-gate-wrapper")).toBeInTheDocument();
    expect(withAuthWrapper).toHaveBeenCalledTimes(1);
  });
});
