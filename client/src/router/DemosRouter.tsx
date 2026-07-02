import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isLocalDevelopment } from "config/env";
import { Footer } from "components";
import { DemonstrationDetail } from "pages/DemonstrationDetail/index";
import { getCurrentUser } from "components/user/UserContext";
import { DemonstrationsPage } from "pages/DemonstrationsPage";
import { ComponentLibrary, DialogSandbox } from "pages/debug";
import { IconLibrary } from "pages/debug/IconLibrary";
import { AuthDebugComponent } from "pages/debug/AuthDebugComponent";
import { DocumentDetailPage } from "pages/DocumentDetails/DocumentDetail";
import { DeliverablesPage } from "pages/DeliverablesPage";
import { ReportsPage } from "pages/ReportsPage";
import { DeliverableDetailsManagementPage } from "pages/deliverables/DeliverableDetailsManagementPage";
import { AdminPage } from "pages/admin/AdminPage";
import { ReferencesPage } from "pages/references/ReferencesPage";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { DemonstrationDetailRouteHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { DeliverableDetailRouteHeader } from "pages/deliverables/DeliverableDetailHeader";
import { AdminHeader } from "pages/admin/AdminHeader";
import { ReferencesHeader } from "pages/references/ReferencesHeader";
import { Layout } from "layout/Layout";
import { SideNav } from "layout/SideNav";
import { PersonType } from "demos-server";

type DemosRouteLayout = React.ComponentProps<typeof Layout>;

export type DemosRouteProps = {
  requiredRoles?: PersonType[];
  debugOnly?: boolean;
  layout?: DemosRouteLayout;
  children?: React.ReactNode;
};

export const DemosRoute: React.FC<DemosRouteProps> = ({
  requiredRoles,
  debugOnly,
  layout,
  children,
}) => {
  const { currentUser } = getCurrentUser();

  if (debugOnly && !isLocalDevelopment()) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.person.personType)) {
    return <Navigate to="/" replace />;
  }

  const page = <Layout {...(layout ?? {})}>{children}</Layout>;

  return page;
};

type DemosRouterEntry = {
  layout?: DemosRouteLayout;
  requiredRoles?: PersonType[];
  debugOnly?: boolean;
  page: React.ReactNode;
};

export const DemosRouter: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const isStateUser = currentUser.person.personType === "demos-state-user";
  const routeConfigByPath: Record<string, DemosRouterEntry> = {
    "document/:id": {
      page: <DocumentDetailPage />,
    },
    "*": {
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <div>404: Page Not Found</div>,
    },
    "/": {
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: isStateUser ? <DeliverablesPage /> : <DemonstrationsPage />,
    },
    deliverables: {
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <DeliverablesPage />,
    },
    components: {
      debugOnly: true,
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <ComponentLibrary />,
    },
    icons: {
      debugOnly: true,
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <IconLibrary />,
    },
    auth: {
      debugOnly: true,
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <AuthDebugComponent />,
    },
    dialogs: {
      debugOnly: true,
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: isStateUser ? undefined : <SideNav />,
        footer: <Footer />,
      },
      page: <DialogSandbox />,
    },
    demonstrations: {
      requiredRoles: ["demos-admin", "demos-cms-user"],
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: <SideNav />,
        footer: <Footer />,
      },
      page: <DemonstrationsPage />,
    },
    reports: {
      requiredRoles: ["demos-admin", "demos-cms-user"],
      layout: {
        headerLower: <DefaultHeaderLower />,
        sideNav: <SideNav />,
        footer: <Footer />,
      },
      page: <ReportsPage />,
    },
    "demonstrations/:id": {
      requiredRoles: ["demos-admin", "demos-cms-user"],
      layout: {
        headerLower: <DemonstrationDetailRouteHeader />,
        footer: <Footer />,
      },
      page: <DemonstrationDetail />,
    },
    "deliverables/:deliverableId": {
      layout: {
        headerLower: <DeliverableDetailRouteHeader />,
        footer: <Footer />,
      },
      page: <DeliverableDetailsManagementPage />,
    },
    admin: {
      layout: {
        headerLower: <AdminHeader />,
        footer: <Footer />,
      },
      page: <AdminPage />,
    },
    references: {
      layout: {
        headerLower: <ReferencesHeader />,
        footer: <Footer />,
      },
      page: <ReferencesPage />,
    },
  };

  return (
    <BrowserRouter>
      <Routes>
        {Object.entries(routeConfigByPath).map(([path, config]) => (
          <Route
            key={path}
            path={path}
            element={<DemosRoute {...config}>{config.page}</DemosRoute>}
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
};
