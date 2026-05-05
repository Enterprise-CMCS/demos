import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "components/user/UserContext";

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = getCurrentUser();

  if (currentUser?.person.personType !== "demos-admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
