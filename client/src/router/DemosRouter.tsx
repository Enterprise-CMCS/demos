import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Footer } from "components";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { getCurrentUser } from "components/user/UserContext";
import { DemonstrationsPage } from "pages/DemonstrationsPage";
import { ComponentLibrary, DialogSandbox } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { AuthDebugComponent } from "pages/debug/AuthDebugComponent";
import { isLocalDevelopment } from "config/env";
import { DocumentDetailPage } from "pages/DocumentDetails/DocumentDetail";
import { DeliverablesPage } from "pages/DeliverablesPage";
import { ReportsPage } from "pages/ReportsPage";
import { DeliverableDetailsManagementPage } from "pages/deliverables/DeliverableDetailsManagementPage";
import { AdminPage } from "pages/admin/AdminPage";
import { RequireRole } from "./RequireRole";
import { ReferencesPage } from "pages/references/ReferencesPage";
import { Layout } from "layout/Layout";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { DemonstrationDetailRouteHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { DeliverableDetailRouteHeader } from "pages/deliverables/DeliverableDetailHeader";
import { AdminHeader } from "pages/admin/AdminHeader";
import { ReferencesHeader } from "pages/references/ReferencesHeader";
import { SideNav } from "layout/SideNav";

const HomePage = () => {
  const { currentUser } = getCurrentUser();

  return currentUser.person.personType === "demos-state-user" ? (
    <DeliverablesPage />
  ) : (
    <DemonstrationsPage />
  );
};

export const DemosRouter: React.FC = () => {
  const { currentUser } = getCurrentUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="document/:id" element={<DocumentDetailPage />} />
        <Route
          element={
            <Layout
              headerLower={<DefaultHeaderLower />}
              sideNav={
                currentUser.person.personType === "demos-state-user" ? undefined : <SideNav />
              }
              footer={<Footer />}
            />
          }
        >
          <Route path="*" element={<div>404: Page Not Found</div>} />
          <Route path="/" element={<HomePage />} />
          <Route path="deliverables" element={<DeliverablesPage />} />
          {isLocalDevelopment() && (
            <>
              <Route path="components" element={<ComponentLibrary />} />
              <Route path="icons" element={<IconLibrary />} />
              <Route path="auth" element={<AuthDebugComponent />} />
              <Route path="dialogs" element={<DialogSandbox />} />
            </>
          )}
        </Route>
        <Route element={<RequireRole allowedRoles={["demos-admin", "demos-cms-user"]} />}>
          <Route
            element={
              <Layout
                headerLower={<DefaultHeaderLower />}
                sideNav={<SideNav />}
                footer={<Footer />}
              />
            }
          >
            <Route path="demonstrations" element={<DemonstrationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route
            element={
              <Layout headerLower={<DemonstrationDetailRouteHeader />} footer={<Footer />} />
            }
          >
            <Route path="demonstrations/:id" element={<DemonstrationDetail />} />
          </Route>
        </Route>
        <Route
          element={<Layout headerLower={<DeliverableDetailRouteHeader />} footer={<Footer />} />}
        >
          <Route
            path="deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
        </Route>
        <Route element={<Layout headerLower={<AdminHeader />} footer={<Footer />} />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route element={<Layout headerLower={<ReferencesHeader />} footer={<Footer />} />}>
          <Route path="references" element={<ReferencesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
