import React from "react";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { getCurrentUser } from "components/user/UserContext";

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const { loading: currentUserLoading, error: currentUserError } = getCurrentUser();

  if (currentUserLoading) {
    return (
      <ToastProvider>
        <div className="h-screen flex flex-col">
          <header className="p-3 shadow">Loading…</header>
          <div className="flex-1 bg-gray-100" />
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
          <div className="flex flex-1 overflow-hidden bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-auto p-2">
              <div className="bg-white shadow-md p-2 max-w-[1600px] mx-auto">{children}</div>
            </div>
          </div>
          <Footer />
        </div>
      </HeaderConfigProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
