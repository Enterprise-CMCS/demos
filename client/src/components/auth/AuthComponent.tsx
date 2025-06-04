import { Collapsible } from "components/collapsible/Collapsible";
import React from "react";
import { useAuth } from "react-oidc-context";
import { SigninButton, SignoutButton } from "./AuthButtons";

const AuthDebug = () => {
  const auth = useAuth();

  return (
    <>
      <div>
        <strong>Is Authenticated?</strong> {auth.isAuthenticated ? "Yes" : "No"}
      </div>
      <div>
        <strong>User:</strong> {auth.user ? JSON.stringify(auth.user, null, 2) : "No user data"}
      </div>
      <div>
        <strong>Access Token:</strong> {auth.user?.access_token || "No access token"}
      </div>
      <Collapsible title="Auth Details (Click to Expand)">
        <pre>{JSON.stringify(auth, null, 2)}</pre>
      </Collapsible>
    </>
  );
};

export const AuthComponent: React.FC = () => {
  const auth = useAuth();

  if (!auth) {
    return <div>Auth context is not available!</div>;
  }

  const authenticationButton = auth.isAuthenticated ?
    (<SignoutButton />) : (<SigninButton />);

  return (
    <>
      <AuthDebug />
      {authenticationButton}
    </>
  );
};
