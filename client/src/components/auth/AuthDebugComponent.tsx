import { Collapsible } from "components/collapsible/Collapsible";
import React from "react";
import { useAuth } from "react-oidc-context";
import { SigninButton, SignoutButton } from "./AuthButtons";

const AuthDebug = () => {
  const auth = useAuth();
  const user = auth.user;

  return (
    <>
      <div className="mb-1">
        Authenticated:{" "}
        <span
          className={auth.isAuthenticated ? "text-green-600" : "text-red-600"}
        >
          {auth.isAuthenticated ? "Yes" : "No"}
        </span>
      </div>
      {user && (
        <>
          {user.profile?.name && (
            <div className="mb-1">
              Name: <span className="font-mono">{user.profile.name}</span>
            </div>
          )}
          {user.profile?.email && (
            <div className="mb-1">
              Email: <span className="font-mono">{user.profile.email}</span>
            </div>
          )}
          {user.profile?.sub && (
            <div className="mb-1">
              User ID: <span className="font-mono">{user.profile.sub}</span>
            </div>
          )}
        </>
      )}
      <Collapsible title="User Access Token (Click to Expand)">
        <pre className="whitespace-pre-wrap break-all text-xs">
          {user?.access_token || "No access token"}
        </pre>
      </Collapsible>
      <Collapsible title="User ID Token (Click to Expand)">
        <pre className="whitespace-pre-wrap break-all text-xs">
          {user?.id_token || "No id token"}
        </pre>
      </Collapsible>
      <Collapsible title="Raw Auth Object (Click to Expand)">
        <pre className="whitespace-pre-wrap break-all text-xs">
          {JSON.stringify(auth, null, 2)}
        </pre>
      </Collapsible>
    </>
  );
};

export const AuthDebugComponent: React.FC = () => {
  const auth = useAuth();

  if (!auth) {
    return <div>Auth context is not available!</div>;
  }

  const authenticationButton = auth.isAuthenticated ? (
    <SignoutButton children="Sign Out" />
  ) : (
    <SigninButton children="Sign In" />
  );

  return (
    <div className="flex flex-col gap-sm">
      <AuthDebug />
      {authenticationButton}
    </div>
  );
};
