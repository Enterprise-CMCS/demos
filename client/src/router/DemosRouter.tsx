import React from "react";
import { BrowserRouter,Routes,Route, Outlet } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import { getCognitoConfig } from "./cognitoConfig";
import { LandingPage } from "pages";
import { ComponentLibrary, TestHooks } from "pages/debug";
import { AuthComponent } from "components/auth/AuthComponent";
import { PrimaryLayout } from "layout/PrimaryLayout";
import { MockedProvider } from "@apollo/client/testing";
import { userMocks } from "hooks/userMocks";
import { Demonstrations } from "pages/Demonstrations";

export const DemosRouter = () => {
  // TODO: When we know what IDM integration looks like
  // We will want to read the JWT claims and
  // add it to the AuthProvider (specifically the user object)
  const cognitoConfig = getCognitoConfig();

  return (
    <AuthProvider {...cognitoConfig}>
      <MockedProvider mocks={userMocks} addTypename={false}>
        <BrowserRouter>
          <Routes>
            <Route element={<PrimaryLayout><Outlet /></PrimaryLayout>}>
              <Route path="/" element={<LandingPage />} />
              {/* These need to exist for Cognito but they don't need to return a component */}
              <Route path="/login" element={<></>} />
              <Route path="/login-redirect" element={<AuthComponent></AuthComponent>} />
              <Route path="/login" element={<AuthComponent />} />
              <Route path="/login-redirect" element={<AuthComponent />} />
              <Route path="demonstrations" element={<Demonstrations />} />
              {/* Debug routes, only available in development mode */}
              {process.env.NODE_ENV === "development" && (
                <>
                  <Route path="/components" element={<ComponentLibrary />} />
                  <Route path="/hooks" element={<TestHooks />} />
                </>
              )}
            </Route>
          </Routes>
        </BrowserRouter>
      </MockedProvider>
    </AuthProvider>
  );
};
