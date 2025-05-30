import React from "react";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage, ComponentLibrary, TestHooks } from "pages";
import { AuthComponent } from "components/auth/AuthComponent";

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthComponent />} />
          <Route path="/login-redirect" element={<AuthComponent />} />
          {process.env.NODE_ENV === "development" && <DebugRoutes />}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
