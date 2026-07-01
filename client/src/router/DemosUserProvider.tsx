import React from "react";
import { withAuthenticationRequired } from "react-oidc-context";
import { Outlet } from "react-router-dom";
import { UserProvider } from "components/user/UserProvider";
import { shouldUseMocks } from "config/env";
import { LoadingScreen } from "components/loading";

const ProvideUser = () => (
  <UserProvider>
    <Outlet />
  </UserProvider>
);

const ProvideUserWithAuth = withAuthenticationRequired(ProvideUser, {
  OnRedirecting: () => <LoadingScreen />,
  signinRedirectArgs: {
    state: { returnUrl: window.location.pathname + window.location.search },
  },
});

export const DemosUserProvider = shouldUseMocks() ? ProvideUser : ProvideUserWithAuth;
