import React from "react";
import { Footer, Header, ToastContainer, ToastProvider } from "components";
import { SideNav } from "./SideNav";
import { useLocation } from "react-router-dom";
import { DialogProvider } from "components/dialog/DialogContext";

export const PrimaryLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const hideSideNav =
    location.pathname.startsWith("/demonstrations/") && location.pathname !== "/demonstrations";
  return (
    <ToastProvider>
      <DialogProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden bg-gray-primary-layout min-h-0">
            {!hideSideNav && <SideNav />}
            <div className="flex-1 overflow-auto min-h-0">
              <div className="p-[16px] pb-5">{children}</div>
              <Footer />
            </div>
          </div>
        </div>
      </DialogProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
