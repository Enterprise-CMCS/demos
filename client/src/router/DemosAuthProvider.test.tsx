import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as envMod from "config/env";
import * as cognitoMod from "./cognitoConfig";
import * as mockAuthMod from "./mockAuthConfig";
import { DemosAuthProvider } from "./DemosAuthProvider";

const { authProviderSpy } = vi.hoisted(() => ({
  authProviderSpy: vi.fn(),
}));

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    shouldUseMocks: vi.fn(() => false),
  };
});

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    authProviderSpy(props);
    return <div data-testid="auth-provider">{children}</div>;
  },
}));

vi.mock("./IdleSessionHandler", () => ({
  IdleSessionHandler: () => <div data-testid="idle-session-handler" />,
}));

describe("DemosAuthProvider", () => {
  beforeEach(() => {
    authProviderSpy.mockReset();
    vi.restoreAllMocks();
  });

  it("uses mock auth props and skips idle session handling in mock mode", () => {
    vi.mocked(envMod.shouldUseMocks).mockReturnValue(true);

    const mockAuthProps = {
      authority: "mock-authority",
      client_id: "mock-client-id",
      redirect_uri: "http://localhost/mock",
    };

    const getMockAuthPropsSpy = vi
      .spyOn(mockAuthMod, "getMockAuthProps")
      .mockReturnValue(mockAuthProps as ReturnType<typeof mockAuthMod.getMockAuthProps>);
    const getCognitoConfigSpy = vi.spyOn(cognitoMod, "getCognitoConfig");
    const getAuthProviderPropsSpy = vi.spyOn(cognitoMod, "getAuthProviderProps");

    render(
      <DemosAuthProvider>
        <div>app content</div>
      </DemosAuthProvider>
    );

    expect(getMockAuthPropsSpy).toHaveBeenCalledTimes(1);
    expect(getCognitoConfigSpy).not.toHaveBeenCalled();
    expect(getAuthProviderPropsSpy).not.toHaveBeenCalled();
    expect(authProviderSpy).toHaveBeenCalledWith(mockAuthProps);
    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(screen.queryByTestId("idle-session-handler")).not.toBeInTheDocument();
  });

  it("uses Cognito auth props and renders idle session handling outside mock mode", () => {
    vi.mocked(envMod.shouldUseMocks).mockReturnValue(false);

    const cognitoConfig = {
      authority: "real-authority",
      client_id: "real-client-id",
      redirect_uri: "http://localhost/real",
      scope: "openid email profile",
      response_type: "code",
      automaticSilentRenew: true,
      onSigninCallback: vi.fn(),
      post_logout_redirect_uri: "http://localhost/",
      domain: "https://example.auth.us-east-1.amazoncognito.com",
    } as ReturnType<typeof cognitoMod.getCognitoConfig>;

    const authProviderProps = {
      authority: cognitoConfig.authority,
      client_id: cognitoConfig.client_id,
      redirect_uri: cognitoConfig.redirect_uri,
      scope: cognitoConfig.scope,
      response_type: cognitoConfig.response_type,
      automaticSilentRenew: cognitoConfig.automaticSilentRenew,
      onSigninCallback: cognitoConfig.onSigninCallback,
    };

    const getCognitoConfigSpy = vi
      .spyOn(cognitoMod, "getCognitoConfig")
      .mockReturnValue(cognitoConfig);
    const getAuthProviderPropsSpy = vi
      .spyOn(cognitoMod, "getAuthProviderProps")
      .mockReturnValue(authProviderProps as ReturnType<typeof cognitoMod.getAuthProviderProps>);
    const getMockAuthPropsSpy = vi.spyOn(mockAuthMod, "getMockAuthProps");

    render(
      <DemosAuthProvider>
        <div>app content</div>
      </DemosAuthProvider>
    );

    expect(getMockAuthPropsSpy).not.toHaveBeenCalled();
    expect(getCognitoConfigSpy).toHaveBeenCalledTimes(1);
    expect(getAuthProviderPropsSpy).toHaveBeenCalledWith(cognitoConfig);
    expect(authProviderSpy).toHaveBeenCalledWith(authProviderProps);
    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(screen.getByTestId("idle-session-handler")).toBeInTheDocument();
  });
});
