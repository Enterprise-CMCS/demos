import React from "react";
import { useAuth, withAuthenticationRequired } from "react-oidc-context";
import { shouldUseMocks } from "config/env";
import { LoadingScreen } from "components/loading";
import { UserAuthenticationFailed } from "components/user/UserAuthenticationFailed";

const RenderChildren = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const RenderChildrenWithAuth = withAuthenticationRequired(RenderChildren, {
  OnRedirecting: () => <LoadingScreen />,
  signinRedirectArgs: {
    state: { returnUrl: window.location.pathname + window.location.search },
  },
});

export const RequireAuthentication: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const AuthenticatedChildren = shouldUseMocks() ? RenderChildren : RenderChildrenWithAuth;

  if (auth.error) {
    return (
      <UserAuthenticationFailed
        name={auth.user?.profile.name}
        email={auth.user?.profile.email}
        errorMessage={auth.error.message}
      />
    );
  }

  return <AuthenticatedChildren>{children}</AuthenticatedChildren>;
};
