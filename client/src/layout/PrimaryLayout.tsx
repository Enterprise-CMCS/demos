import React from "react";
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
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden bg-gray-primary-layout">
          <SideNav />
          <div className="flex-1 overflow-auto p-[16px] pb-5">{children}</div>
        </div>
        <Footer />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
};
