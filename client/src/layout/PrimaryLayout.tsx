// src/layout/PrimaryLayout.tsx
import React, { useState } from "react";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { useCurrentUser } from "components/user/UserContext";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, loading, error } = useCurrentUser();
  console.log("PrimaryLayout currentUser:", currentUser);

  // You now have the *real* user id from the server
  const userId = currentUser?.id ?? "";

  // Optional: lightweight loading fence so Header doesn't flicker
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

  // Optional: surface auth/data errors
  if (error) {
    // You can render something nicer or trigger a sign-out here
    console.error("[PrimaryLayout] currentUser error:", error);
  }

  return (
    <ToastProvider>
      <HeaderConfigProvider
        defaultLowerContent={<DefaultHeaderLower userId={userId} />}
      >
        <div className="h-screen flex flex-col">
          <Header userId={userId} />
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
