import React from "react";
import { getCognitoConfig, getAuthProviderProps } from "./cognitoConfig";
import { IdleSessionHandler } from "./IdleSessionHandler";
import { shouldBypassAuth } from "config/env";
import { getMockAuthProps } from "./mockAuthConfig";
import { AuthProvider } from "react-oidc-context";

export const DemosAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authProps = shouldBypassAuth()
    ? getMockAuthProps()
    : getAuthProviderProps(getCognitoConfig());

  return (
    <AuthProvider {...authProps}>
      {children}
      {!shouldBypassAuth() && <IdleSessionHandler />}
    </AuthProvider>
  );
};
