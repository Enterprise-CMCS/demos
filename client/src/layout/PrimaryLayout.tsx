// src/layout/PrimaryLayout.tsx
import React, { useState } from "react";

import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import {
  Footer,
  Header,
  ToastContainer,
  ToastProvider,
} from "components/index";

import { SideNav } from "./SideNav";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <HeaderConfigProvider defaultLowerContent={<DefaultHeaderLower userId={2} />}>
        <div className="h-screen flex flex-col">
          <Header userId={2} />
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
