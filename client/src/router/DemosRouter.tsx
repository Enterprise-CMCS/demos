import React from "react";

import { AuthComponent } from "components/auth/AuthComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { ComponentLibrary } from "pages/debug";
import { Demonstrations } from "pages/Demonstrations";
import { LandingPage } from "pages/LandingPage";
import { AuthProvider } from "react-oidc-context";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes
} from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";

import { getCognitoConfig } from "../router/cognitoConfig";
import { userMocks } from "hooks/userMocks";

export function DemosRouter() {
  const cognitoConfig = getCognitoConfig();

  // Authenticated routes with shared layout
  const authenticatedRoutes = (
    <Route
      element={
        <PrimaryLayout>
          <Outlet />
        </PrimaryLayout>
      }
    >
      <Route path="demonstrations" element={<Demonstrations />} />
      {process.env.NODE_ENV === "development" && (
        <Route path="components" element={<ComponentLibrary />} />
      )}
    </Route>
  );

  return (
    <AuthProvider {...cognitoConfig}>
      <MockedProvider mocks={userMocks} addTypename={false}>
        <BrowserRouter>
          <Routes>
            <Route element={<PrimaryLayout><Outlet /></PrimaryLayout>}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthComponent />} />
              <Route path="/login-redirect" element={<AuthComponent />} />
              <Route path="demonstrations" element={<Demonstrations />} />
              {process.env.NODE_ENV === "development" && (
                <Route path="components" element={<ComponentLibrary />} />
              )}
              {authenticatedRoutes}
            </Route>
          </Routes>
        </BrowserRouter>
      </MockedProvider>
    </AuthProvider>
  );
}
