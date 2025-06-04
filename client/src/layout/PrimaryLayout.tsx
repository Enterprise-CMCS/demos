import React, { useState } from "react";
import { SideNav } from "./SideNav";
import { Footer, Header } from "components/index";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header userId={2}/>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidenav flex basis */}
        <div className={collapsed ? "w-20" : "w-64"}>
          <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50 transition-all duration-300">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
