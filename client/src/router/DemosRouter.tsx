import React from "react";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthComponent } from "components/debug/AuthComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";

// Routes that are only available in development mode
export const DemosRouter = () =>  {
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...cognitoConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrimaryLayout><LandingPage /></PrimaryLayout>} />
          <Route path="/login" element={<AuthComponent />} />
          <Route path="/login-redirect" element={<AuthComponent />} />
          {/* Debug routes, only available in development mode */}
          {process.env.NODE_ENV === "development" && (
            <>
              <Route path="/components" element={<ComponentLibrary />} />
              <Route path="/hooks" element={<TestHooks />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
