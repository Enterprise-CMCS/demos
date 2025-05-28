import React from "react";

import AuthComponent from "components/auth/AuthComponent";
import AppLayout from "components/layout/AppLayout";
import Actions from "pages/Actions";
import Budget from "pages/Budget";
import ComponentLibrary from "pages/ComponentLibrary";
import Demonstrations from "pages/Demonstrations";
import LandingPage from "pages/LandingPage";
import Reports from "pages/Reports";
import Tasks from "pages/Tasks";
import { AuthProvider } from "react-oidc-context";
import {
  BrowserRouter,
  Outlet,
  Route,
  Routes
} from "react-router-dom";

import { getCognitoConfig } from "./cognitoConfig";

// import Dashboard from "./Dashboard";
export default function DemosRouter() {
  const cognitoConfig = getCognitoConfig();

  // Authenticated routes with shared layout
  const authenticatedRoutes = (
    <Route
      element={
        <AppLayout>
          <Outlet />
        </AppLayout>
      }
    >
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      <Route path="/demonstrations" element={<Demonstrations />} />
      <Route path="/actions" element={<Actions />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/budget" element={<Budget />} />
      {process.env.NODE_ENV === "development" && (
        <Route path="/components" element={<ComponentLibrary />} />
      )}
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
