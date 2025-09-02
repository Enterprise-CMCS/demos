import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { getAuthProviderProps } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthDebugComponent } from "components/auth/AuthDebugComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { Demonstrations } from "pages/Demonstrations";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { IconLibrary } from "pages/debug/IconLibrary";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { SignedOut } from "pages/SignedOut";
import { isLocalDevelopment } from "config/env";
import { EventSandbox } from "pages/debug/EventSandbox";
import { UserProvider } from "components/user/UserContext";
import { RequireAuth } from "components/auth/RequireAuth";

export const DemosRouter = () => {
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...getAuthProviderProps(cognitoConfig)}>
      <DemosApolloProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              {/* PUBLIC routes */}
              <Route path="/sign-out" element={<SignedOut />} />
              {/* PROTECTED routes */}
              <Route
                element={
                  <RequireAuth>
                    <DemosApolloProvider>
                      <UserProvider>
                        <PrimaryLayout>
                          <Outlet />
                        </PrimaryLayout>
                      </UserProvider>
                    </DemosApolloProvider>
                  </RequireAuth>
                }
              >
                <Route path="/" element={<LandingPage />} />
                <Route path="demonstrations" element={<Demonstrations />} />
                <Route path="demonstrations/:id" element={<DemonstrationDetail />} />
                {isLocalDevelopment() && (
                  <>
                    <Route path="/components" element={<ComponentLibrary />} />
                    <Route path="/hooks" element={<TestHooks />} />
                    <Route path="/icons" element={<IconLibrary />} />
                    <Route path="/events" element={<EventSandbox />} />
                    <Route path="/auth" element={<AuthDebugComponent />} />
                  </>
                )}
              </Route>

              {/* Debug auth route can remain public if you want */}
              <Route path="*" element={<div>404: Page Not Found</div>} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DemosApolloProvider>
    </AuthProvider>
  );
};
