import React, { useState } from "react";
import SideNav from "./SideNav";
import Header from "./Header";
import Footer from "./Footer";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header />
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

export default PrimaryLayout;
