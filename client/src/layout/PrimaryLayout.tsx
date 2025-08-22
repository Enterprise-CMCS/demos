// src/layout/PrimaryLayout.tsx
import React, { useState } from "react";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { getCurrentUser } from "components/user/UserContext";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, loading, error } = getCurrentUser();
  const userId = currentUser?.id;

  if (loading) {
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

  if (error) {
    console.error("[PrimaryLayout] currentUser error:", error);
  }

  return (
    <ToastProvider>
      <HeaderConfigProvider
        defaultLowerContent={<DefaultHeaderLower />}
      >
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden bg-gray-100">
            <div className={collapsed ? "w-20" : "w-64"}>
              <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="bg-white shadow-md p-2 max-w-[1600px] mx-auto">
                {children}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </HeaderConfigProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
