import React from "react";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden bg-gray-primary-layout">
          <SideNav />
          <div className="flex-1 overflow-auto p-[16px] pb-5">{children}</div>
        </div>
        <Footer />
      </div>
      <ToastContainer />
    </ToastProvider>
  );
};
