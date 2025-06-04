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

import { getCognitoConfig } from "./cognitoConfig";

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
      {/* Add other authenticated routes here */}
    </Route>
  );

  return (
    <AuthProvider {...cognitoConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthComponent />} />
          <Route path="/login-redirect" element={<AuthComponent />} />
          {authenticatedRoutes}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
