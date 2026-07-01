import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { DemosAuthProvider } from "./DemosAuthProvider";
import { getCurrentUser } from "components/user/UserContext";
import { DemonstrationsPage } from "pages/DemonstrationsPage";
import { ComponentLibrary, DialogSandbox } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { AuthDebugComponent } from "pages/debug/AuthDebugComponent";
import { isLocalDevelopment } from "config/env";
import { DemosLayoutProvider } from "./DemosLayoutProvider";
import { DemosUserProvider } from "./DemosUserProvider";
import { DocumentDetailPage } from "pages/DocumentDetails/DocumentDetail";
import { DeliverablesPage } from "pages/DeliverablesPage";
import { ReportsPage } from "pages/ReportsPage";
import { DeliverableDetailsManagementPage } from "pages/deliverables/DeliverableDetailsManagementPage";
import { AdminPage } from "pages/admin/AdminPage";
import { RequireRole } from "./RequireRole";
import { PersonType } from "demos-server";
import { ReferencesPage } from "pages/references/ReferencesPage";

const DEMONSTRATION_ACCESS_ROLES: PersonType[] = ["demos-admin", "demos-cms-user"];

const HomePage = () => {
  const { currentUser } = getCurrentUser();

  return currentUser.person.personType === "demos-state-user" ? (
    <DeliverablesPage />
  ) : (
    <DemonstrationsPage />
  );
};

export const DemosRouter: React.FC = () => {
  return (
    <DemosAuthProvider>
      <DemosApolloProvider>
        <DemosUserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="document/:id" element={<DocumentDetailPage />} />
              <Route element={<DemosLayoutProvider />}>
                <Route path="*" element={<div>404: Page Not Found</div>} />
                <Route path="/" element={<HomePage />} />
                <Route
                  path="demonstrations"
                  element={
                    <RequireRole allowedRoles={DEMONSTRATION_ACCESS_ROLES}>
                      <DemonstrationsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="demonstrations/:id"
                  element={
                    <RequireRole allowedRoles={DEMONSTRATION_ACCESS_ROLES}>
                      <DemonstrationDetail />
                    </RequireRole>
                  }
                />
                <Route path="deliverables" element={<DeliverablesPage />} />
                <Route
                  path="deliverables/:deliverableId"
                  element={<DeliverableDetailsManagementPage />}
                />
                <Route
                  path="reports"
                  element={
                    <RequireRole allowedRoles={["demos-admin", "demos-cms-user"]}>
                      <ReportsPage />
                    </RequireRole>
                  }
                />
                <Route path="admin" element={<AdminPage />} />
                <Route path="references" element={<ReferencesPage />} />

                {isLocalDevelopment() && (
                  <>
                    <Route path="components" element={<ComponentLibrary />} />
                    <Route path="icons" element={<IconLibrary />} />
                    <Route path="auth" element={<AuthDebugComponent />} />
                    <Route path="dialogs" element={<DialogSandbox />} />
                  </>
                )}
              </Route>
            </Routes>
          </BrowserRouter>
        </DemosUserProvider>
      </DemosApolloProvider>
    </DemosAuthProvider>
  );
};
