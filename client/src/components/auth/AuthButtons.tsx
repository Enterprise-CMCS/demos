import React from "react";
import { PrimaryButton } from "components/button/PrimaryButton";
import { useAuth } from "react-oidc-context";
import { logout } from "router/cognitoConfig";

export const SignoutButton = () => {
  const auth = useAuth();
  const handleLogout = () => {
    auth.removeUser();
    logout();
  };

  return <PrimaryButton onClick={handleLogout}>Sign Out</PrimaryButton>;
};

export const SigninButton = () => {
  const auth = useAuth();
  const handleSignin = () => {
    auth.signinRedirect();
  };

  return <PrimaryButton onClick={handleSignin}>Sign In</PrimaryButton>;
};
