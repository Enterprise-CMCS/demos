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
      <Main>
        <div className="flex">
          <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
          <main
            className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"
            } w-full min-h-screen p-6 bg-gray-50`}
          >
            {children}
          </main>
        </div>
      </Main>
      <Footer />
    </Fragment>
  );
};

export default PrimaryLayout;
