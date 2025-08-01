import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthComponent } from "components/auth/AuthComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { Demonstrations } from "pages/Demonstrations";
import { DemonstrationDetail } from "pages/DemonstrationDetail/DemonstrationDetail";
import { IconLibrary } from "pages/debug/IconLibrary";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { isDevelopmentMode } from "config/env";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { EventSandbox } from "pages/debug/EventSandbox";

export const DemosRouter = () => {
  // TODO: When we know what IDM integration looks like
  // We will want to read the JWT claims and
  // add it to the AuthProvider (specifically the user object)
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...cognitoConfig}>
      <DemosApolloProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                <Route
                  path="demonstrations/:id"
                  element={<DemonstrationDetail />}
                />
                {/* Debug routes, only available in development mode */}
                {isDevelopmentMode() && (
                  <>
                    <Route path="/components" element={<ComponentLibrary />} />
                    <Route path="/hooks" element={<TestHooks />} />
                    <Route path="/auth" element={<AuthComponent />} />
                    <Route path="/icons" element={<IconLibrary />} />
                    <Route path="/events" element={<EventSandbox />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </DemosApolloProvider>
    </AuthProvider>
  );
};
