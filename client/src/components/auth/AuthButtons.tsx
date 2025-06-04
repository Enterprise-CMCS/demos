import React from "react";
import { PrimaryButton } from "components/button/PrimaryButton";
import { useAuth } from "react-oidc-context";
import { getCognitoConfig, getCognitoLogoutUrl, logout } from "router/cognitoConfig";

export const SignoutButton = () => {
  const auth = useAuth();
  console.debug("Cognito logout URL:", getCognitoLogoutUrl(getCognitoConfig()));


  return (
    <PrimaryButton
      onClick={() => {
        auth.signoutRedirect();
        logout(); // We should be using auth.sigoutRedirect() but that is not working.
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
