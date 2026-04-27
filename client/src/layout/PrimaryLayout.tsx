import React from "react";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { useLocation } from "react-router-dom";
import { DialogProvider } from "components/dialog/DialogContext";
import { getCurrentUser } from "components/user/UserContext";
import type { PersonType } from "demos-server";

const ROUTES_WITH_HIDDEN_SIDENAV = ["/demonstrations/", "/deliverables/", "/admin"];

export const shouldHideSideNav = (pathname: string, userType?: PersonType) =>
  (userType === "demos-state-user" && pathname === "/") ||
  ROUTES_WITH_HIDDEN_SIDENAV.some((route) => {
    if (!route.endsWith("/") && pathname === route) return true;
    const pathStartsWithRoute = pathname.startsWith(route);
    const pathIsLongerThanRoute = pathname.length > route.length;
    return pathStartsWithRoute && pathIsLongerThanRoute;
  });

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { currentUser } = getCurrentUser();
  const hideSideNav = shouldHideSideNav(location.pathname, currentUser?.person.personType);

  return (
    <ToastProvider>
      <DialogProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden bg-gray-primary-layout min-h-0">
            {!hideSideNav && <SideNav />}
            <div className="flex-1 overflow-auto min-h-0 flex flex-col">
              <div className="p-[16px] pb-5 flex-1">{children}</div>
              <Footer />
            </div>
          </div>
        </div>
      </DialogProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
