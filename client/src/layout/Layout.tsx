import React from "react";
import { Header, ToastContainer, ToastProvider } from "components";
import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { Outlet } from "react-router-dom";
import { DialogProvider } from "components/dialog/DialogContext";

export const Layout = ({
  headerLower = <DefaultHeaderLower />,
  sideNav,
  footer,
  children,
}: {
  headerLower?: React.ReactNode;
  sideNav?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const shouldRenderHeader = Boolean(sideNav) || Boolean(footer);

  return (
    <ToastProvider>
      <DialogProvider>
        <div className="h-screen flex flex-col">
          {shouldRenderHeader && <Header headerLower={headerLower} />}
          <div className="flex flex-1 overflow-hidden bg-gray-primary-layout min-h-0">
            {sideNav}
            <div className="relative flex-1 overflow-auto min-h-0 flex flex-col">
              <div className="p-[16px] flex-1">{children ?? <Outlet />}</div>
            </div>
          </div>
          {footer}
        </div>
      </DialogProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
