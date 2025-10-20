import React from "react";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { withAuthenticationRequired } from "react-oidc-context";

import { Outlet } from "react-router-dom";
import { shouldBypassAuth } from "config/env";

const ProvideLayout = () => (
  <PrimaryLayout>
    <Outlet />
  </PrimaryLayout>
);

const ProvideLayoutWithAuth = withAuthenticationRequired(ProvideLayout, {
  OnRedirecting: () => <></>,
  signinRedirectArgs: {
    state: { returnUrl: window.location.pathname + window.location.search },
  },
});

export const DemosLayoutProvider = shouldBypassAuth() ? ProvideLayout : ProvideLayoutWithAuth;
