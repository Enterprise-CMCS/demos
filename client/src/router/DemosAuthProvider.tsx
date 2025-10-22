import React from "react";
import { getCognitoConfig, getAuthProviderProps } from "./cognitoConfig";
import { IdleSessionHandler } from "./IdleSessionHandler";
import { getMockAuthProps } from "./mockAuthConfig";
import { AuthProvider } from "react-oidc-context";
import { shouldUseMocks } from "config/env";

export const DemosAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authProps = shouldUseMocks()
    ? void getMockAuthProps()
    : getAuthProviderProps(getCognitoConfig());

  return (
    <AuthProvider {...authProps}>
      {children}
      {!shouldUseMocks() && <IdleSessionHandler />}
    </AuthProvider>
  );
};
