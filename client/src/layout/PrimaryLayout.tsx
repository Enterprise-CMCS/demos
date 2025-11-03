import React from "react";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { getCurrentUser } from "components/user/UserContext";
import { useLocation } from "react-router-dom";

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const { loading: currentUserLoading, error: currentUserError } = getCurrentUser();
  const location = useLocation();

  const hideSideNav =
    location.pathname.startsWith("/demonstrations/") && location.pathname !== "/demonstrations";

  if (currentUserLoading) {
    return (
      <ToastProvider>
        <div className="h-screen flex flex-col">
          <header className="p-3 shadow">Loading…</header>
          <div className="flex-1 bg-gray-primary-layout" />
          <ToastContainer />
        </div>
      </ToastProvider>
    );
  }

  if (currentUserError) {
    console.error("[PrimaryLayout] currentUser error:", currentUserError);
  }

  return (
    <ToastProvider>
      <HeaderConfigProvider defaultLowerContent={<DefaultHeaderLower />}>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden bg-gray-primary-layout min-h-0">
            {!hideSideNav && <SideNav />}
            <div className="flex-1 overflow-auto min-h-0">
              <div className="p-[16px] pb-5">{children}</div>
              <Footer />
            </div>
          </div>
        </div>
      </HeaderConfigProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
