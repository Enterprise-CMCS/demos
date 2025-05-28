import React, { useState } from "react";
import SideNav from "./SideNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"
        } w-full min-h-screen p-6 bg-gray-50`}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
