import React from "react";
import { useAuth } from "react-oidc-context";
import { useAuthActions } from "./AuthActions";
import { getCognitoConfig, getCognitoLogoutUrl } from "router/cognitoConfig";

export function SigninLink(): React.ReactElement {
  const { signIn } = useAuthActions();
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        signIn();
      }}
    >
      Sign In
    </a>
  );
}

export function SignoutLink(): React.ReactElement {
  const auth = useAuth();
  const logoutHref = getCognitoLogoutUrl(getCognitoConfig());

  return (
    <a
      href={logoutHref}
      onClick={() => {
        auth.removeUser?.();
      }}
    >
      Sign Out
    </a>
  );
}
