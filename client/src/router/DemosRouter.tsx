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
import { LandingPage } from "pages";
import { Demonstrations } from "pages/Demonstrations";
import { ComponentLibrary } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { EventSandbox } from "pages/debug/EventSandbox";
import { AuthDebugComponent } from "components/auth/AuthDebugComponent";
import { isLocalDevelopment } from "config/env";
import { PhaseDatesSimulation } from "components/application/dates/PhaseDateSimulation";

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

export const DemosRouter: React.FC = () => {
  const cfg = getCognitoConfig();

  return (
    <AuthProvider {...getAuthProviderProps(cfg)}>
      <DemosApolloProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              {/* Everything below is protected */}
              <Route element={<AuthGuard />}>
                <Route path="*" element={<div>404: Page Not Found</div>} />
                <Route path="/" element={<LandingPage />} />
                <Route path="demonstrations" element={<Demonstrations />} />
                <Route path="demonstrations/:id" element={<DemonstrationDetail />} />

                {isLocalDevelopment() && (
                  <>
                    <Route path="components" element={<ComponentLibrary />} />
                    <Route path="icons" element={<IconLibrary />} />
                    <Route path="events" element={<EventSandbox />} />
                    <Route path="auth" element={<AuthDebugComponent />} />
                    <Route path="dates" element={<PhaseDatesSimulation />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DemosApolloProvider>
      <IdleSessionHandler />
    </AuthProvider>
  );
};
