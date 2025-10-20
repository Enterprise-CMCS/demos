import React from "react";
import { withAuthenticationRequired } from "react-oidc-context";
import { Outlet } from "react-router-dom";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { shouldUseMocks } from "config/env";

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

export const DemosLayoutProvider = shouldUseMocks() ? ProvideLayout : ProvideLayoutWithAuth;
