import React from "react";
import { getCurrentUser } from "components/user/UserContext";
import { Navigate } from "react-router-dom";

type RequireRoleProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser } = getCurrentUser();

  const userRole = currentUser?.person?.personType;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
