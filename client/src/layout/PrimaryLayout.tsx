// src/layout/PrimaryLayout.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useUpsertUser } from "mutations/useUpsertUser";

import { DefaultHeaderLower } from "components/header/DefaultHeaderLower";
import { HeaderConfigProvider } from "components/header/HeaderConfigContext";
import {
  Footer,
  Header,
  ToastContainer,
  ToastProvider,
} from "components/index";
import { shouldUseMocks } from "config/env";

import { SideNav } from "./SideNav";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export const PrimaryLayout: React.FC<PrimaryLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const auth = useAuth();
  const [upsertUser] = useUpsertUser();

  // Use different user ID based on environment - always string now
  const userId = shouldUseMocks() ? "2" : "cb88fd69-9509-40ed-9029-610231fe9e18";
  // userId = "cb88fd69-9509-40ed-9029-610231fe9e18";

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const profile = auth.user.profile;
      upsertUser({
        variables: {
          input: {
            cognito_subject: profile.sub, // OIDC subject
            username: profile.preferred_username || profile.username || profile.email,
            email: profile.email,
            full_name: profile.name || `${profile.given_name ?? ""} ${profile.family_name ?? ""}`.trim(),
            display_name: profile.nickname || profile.name || profile.preferred_username || profile.email,
          },
        },
      });
    }
  }, [auth.isAuthenticated, auth.user, upsertUser]);

  return (
    <ToastProvider>
      <HeaderConfigProvider defaultLowerContent={<DefaultHeaderLower userId={userId} />}>
        <div className="h-screen flex flex-col">
          <Header userId={userId} />
          <div className="flex flex-1 overflow-hidden bg-gray-100">
            <div className={collapsed ? "w-20" : "w-64"}>
              <SideNav collapsed={collapsed} setCollapsed={setCollapsed} />
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="bg-white shadow-md p-2 max-w-[1600px] mx-auto">
                {children}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </HeaderConfigProvider>
      <ToastContainer />
    </ToastProvider>
  );
};
