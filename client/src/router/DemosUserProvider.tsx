import React from "react";
import { withAuthenticationRequired } from "react-oidc-context";
import { UserProvider } from "components/user/UserProvider";
import { shouldUseMocks } from "config/env";
import { LoadingScreen } from "components/loading";

const ProvideUser = ({ children }: { children: React.ReactNode }) => {
  return <UserProvider>{children}</UserProvider>;
};

const ProvideUserWithAuth = withAuthenticationRequired(ProvideUser, {
  OnRedirecting: () => <LoadingScreen />,
  signinRedirectArgs: {
    state: { returnUrl: window.location.pathname + window.location.search },
  },
});

export const DemosUserProvider = shouldUseMocks() ? ProvideUser : ProvideUserWithAuth;
