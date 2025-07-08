import React, { useState } from "react";
import { SideNav } from "./SideNav";
import {
  Footer,
  Header,
  ToastContainer,
  ToastProvider,
} from "components/index";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";

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
          <div className="flex flex-1 overflow-hidden">
            <div className={collapsed ? "w-20" : "w-64"}>
              <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>
            <main className="flex-1 overflow-auto p-2 bg-gray-50 transition-all duration-300">
              {children}
            </main>
          </div>
          <Footer />
        </div>
      </HeaderConfigProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
