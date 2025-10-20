// src/router/DemosRouter.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider, withAuthenticationRequired } from "react-oidc-context";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { getCognitoConfig, getAuthProviderProps } from "./cognitoConfig";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { IdleSessionHandler } from "./IdleSessionHandler";
import { UserProvider } from "components/user/UserContext";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { DemonstrationsPage } from "pages/DemonstrationsPage";
import { ComponentLibrary } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { EventSandbox } from "pages/debug/EventSandbox";
import { AuthDebugComponent } from "components/auth/AuthDebugComponent";
import { ApplicationDateSimulation } from "components/application/dates/ApplicationDateSimulation";
import { isLocalDevelopment, shouldBypassAuth } from "config/env";

// Mock AuthProvider for bypassing authentication
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// 1) Shell that provides the layout and outlet for child routes
function ProtectedShell() {
  return (
    <PrimaryLayout>
      <Outlet />
    </PrimaryLayout>
  );
}

const AuthGuard = withAuthenticationRequired(ProtectedShell, {
  OnRedirecting: () => <></>,
  signinRedirectArgs: {
    state: { returnUrl: window.location.pathname + window.location.search },
  },
});

// When bypassing auth, just render the shell directly without auth guard
const MaybeAuthGuard = shouldBypassAuth() ? ProtectedShell : AuthGuard;

export const DemosRouter: React.FC = () => {
  const cfg = getCognitoConfig();
  const bypassAuth = shouldBypassAuth();

  // Choose auth provider based on bypass flag
  const AuthWrapper = bypassAuth ? MockAuthProvider : AuthProvider;
  const authProps = bypassAuth ? {} : getAuthProviderProps(cfg);

  return (
    <AuthWrapper {...authProps}>
      <DemosApolloProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              {/* Everything below is protected (or not, if bypassing) */}
              <Route element={<MaybeAuthGuard />}>
                <Route path="*" element={<div>404: Page Not Found</div>} />
                <Route path="/" element={<DemonstrationsPage />} />
                <Route path="demonstrations" element={<DemonstrationsPage />} />
                <Route path="demonstrations/:id" element={<DemonstrationDetail />} />

                {isLocalDevelopment() && (
                  <>
                    <Route path="components" element={<ComponentLibrary />} />
                    <Route path="icons" element={<IconLibrary />} />
                    <Route path="events" element={<EventSandbox />} />
                    <Route path="auth" element={<AuthDebugComponent />} />
                    <Route path="dates" element={<ApplicationDateSimulation />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DemosApolloProvider>
      <IdleSessionHandler />
    </AuthWrapper>
  );
};
