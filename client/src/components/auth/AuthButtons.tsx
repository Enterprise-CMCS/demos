import React from "react";
import { PrimaryButton } from "components/button/PrimaryButton";
import { useAuth } from "react-oidc-context";
import { logout } from "router/cognitoConfig";

export const SignoutButton = () => {
  const auth = useAuth();

  return (
    <PrimaryButton
      onClick={() => {
        auth.removeUser();
        logout();
      }}>Sign Out
    </PrimaryButton>
  );
};

export const SigninButton = () => {
  const auth = useAuth();

  return (
    <PrimaryButton
      onClick={() => auth.signinRedirect()}>Sign In
    </PrimaryButton>
  );
};
