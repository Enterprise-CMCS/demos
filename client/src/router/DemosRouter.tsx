import React from "react";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthComponent } from "components/auth/AuthComponent";
import PrimaryLayout from "layout/PrimaryLayout";

// Routes that are only available in development mode
const DebugRoutes = () => {
  return (
    <>
      <Route path="/components" element={<ComponentLibrary />} />
      <Route path="/hooks" element={<TestHooks />} />
    </>
  );
};

export const DemosRouter = () =>  {
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...cognitoConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrimaryLayout><LandingPage /></PrimaryLayout>} />
          <Route path="/login" element={<AuthComponent />} />
          <Route path="/login-redirect" element={<AuthComponent />} />
          {process.env.NODE_ENV === "development" && <DebugRoutes />}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
