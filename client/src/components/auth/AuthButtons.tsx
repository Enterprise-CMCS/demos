import React from "react";
import { Button } from "components/button/Button";
import { useAuth } from "react-oidc-context";
import { logout } from "router/cognitoConfig";

export const SignoutButton = () => {
  const auth = useAuth();
  const handleLogout = () => {
    auth.removeUser();
    logout();
  };

  return <Button onClick={handleLogout}>Sign Out</Button>;
};

export const SigninButton = () => {
  const auth = useAuth();
  const handleSignin = () => {
    auth.signinRedirect();
  };

  return <Button onClick={handleSignin}>Sign In</Button>;
};
