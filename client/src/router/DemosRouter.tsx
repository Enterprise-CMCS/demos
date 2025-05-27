import React from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import LandingPage from "pages/LandingPage";
import ComponentLibrary from "pages/ComponentLibrary";
import AuthComponent from "components/auth/AuthComponent";
import TestHooks from "pages/TestHooks";

export default function DemosRouter() {
  const cognitoConfig = getCognitoConfig();

  // Routes that are only available in development mode
  const debugRoutes = process.env.NODE_ENV === "development" ? (
    <>
      <Route path="/components" element={<ComponentLibrary />} />
      <Route path="/hooks" element={<TestHooks />} />
    </>
  ) : null;

  return (
    <AuthProvider {...cognitoConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthComponent />} />
          <Route path="/login-redirect" element={<AuthComponent />} />
          {debugRoutes}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
