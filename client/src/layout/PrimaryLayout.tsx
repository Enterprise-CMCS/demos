import React, { useState } from "react";
import SideNav from "./SideNav";
import { Footer, Header } from "components/index";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex flex-1">
        <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
        <main
          className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"
          } w-full min-h-screen p-6 bg-gray-50`}
        >{children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PrimaryLayout;
