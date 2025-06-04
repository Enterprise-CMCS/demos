import React from "react";
import { BrowserRouter,Routes,Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthComponent } from "components/auth/AuthComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";

export const DemosRouter = () =>  {
  // TODO: When we know what IDM integration looks like
  // We will want to read the JWT claims and
  // add it to the AuthProvider (specifically the user object)
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...cognitoConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrimaryLayout><LandingPage /></PrimaryLayout>} />
          {/* These need to exist for Cognito but they don't need to return a component */}
          <Route path="/login" element={<></>} />
          <Route path="/login-redirect" element={<AuthComponent></AuthComponent>} />
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
