// src/components/PrimaryLayout.tsx
import React, { useState, Fragment } from "react";
import { Header, Main, Footer } from "components";
import SideNav from "./SideNav";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Fragment>
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
    </Fragment>
  );
};

export default PrimaryLayout;
