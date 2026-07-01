import React from "react";
import { getCurrentUser } from "components/user/UserContext";
import { Navigate, Outlet } from "react-router-dom";
import { PersonType } from "demos-server";

type RequireRoleProps = {
  allowedRoles: PersonType[];
  children?: React.ReactNode;
};

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { currentUser } = getCurrentUser();

  const userRole = currentUser.person.personType;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
