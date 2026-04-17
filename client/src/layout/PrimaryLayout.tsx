import React from "react";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { useLocation } from "react-router-dom";
import { DialogProvider } from "components/dialog/DialogContext";

const ROUTES_WITH_HIDDEN_SIDENAV = ["/demonstrations/", "/deliverables/"];

export const shouldHideSideNav = (pathname: string) =>
  ROUTES_WITH_HIDDEN_SIDENAV.some((route) => {
    const pathStartsWithRoute = pathname.startsWith(route);
    const pathIsLongerThanRoute = pathname.length > route.length;
    return pathStartsWithRoute && pathIsLongerThanRoute;
  });

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideSideNav = shouldHideSideNav(location.pathname);

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
