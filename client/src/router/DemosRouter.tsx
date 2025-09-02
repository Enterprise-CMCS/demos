import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthDebugComponent } from "components/auth/AuthDebugComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { Demonstrations } from "pages/Demonstrations";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { IconLibrary } from "pages/debug/IconLibrary";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { isLocalDevelopment } from "config/env";
import { EventSandbox } from "pages/debug/EventSandbox";
import { UserProvider } from "components/user/UserContext";

export const DemosRouter = () => {
  const cognitoConfig = getCognitoConfig();
  return (
    <AuthProvider {...cognitoConfig}>
      <DemosApolloProvider>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route
                element={
                  <PrimaryLayout>
                    <Outlet />
                  </PrimaryLayout>
                }
              >
                {/* Real Pages the user should be able to access */}
                <Route path="/" element={<LandingPage />} />
                <Route path="demonstrations" element={<Demonstrations />} />
                {/* DEBG AUTH IN EARLY STAGE DEV */}
                <Route path="/auth" element={<AuthDebugComponent />} />
                <Route path="demonstrations/:id" element={<DemonstrationDetail />} />
                {/* 404 Page */}
                <Route path="*" element={<div>404: Page Not Found</div>} />
                {/* Debug routes, only available in development mode */}
                {isLocalDevelopment() && (
                  <>
                    <Route path="/components" element={<ComponentLibrary />} />
                    <Route path="/hooks" element={<TestHooks />} />
                    <Route path="/icons" element={<IconLibrary />} />
                    <Route path="/events" element={<EventSandbox />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </DemosApolloProvider>
    </AuthProvider>
  );
};
