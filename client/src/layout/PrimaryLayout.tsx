import React, { useState } from "react";
import { Header, Footer } from "components/index";
import { SideNav } from "./SideNav";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Header />
      <div className="flex mt-16 min-h-[calc(100vh-64px)]">
        <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />

        <main
          className={`transition-all duration-300 bg-gray-50 w-full p-6 ${
            collapsed ? "ml-20" : "ml-64"
          }`}
        >
          {children}
        </main>
      </div>

      <Footer />
    </>
  );
};
