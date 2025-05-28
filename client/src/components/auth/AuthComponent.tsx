import Collapsible from "components/collapsible/Collapsible";
import { logoutToCognito } from "../../router/cognitoConfig";
import React, { Fragment } from "react";
import { useAuth } from "react-oidc-context";
import DebugOnly from "components/debug/DebugOnly";

// This is a debug component to show the auth state.
// It should be removed or hidden in production.
const AuthDebug = () => {
  const auth = useAuth();

  return (
    <Fragment>
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
    </Fragment>
  );
};

// For now a one stop shop for authentication.
// In the future this may just be things like <LoginButton /> and <LogoutButton />
// which are used in the header and other places.
const AuthComponent: React.FC = () => {
  const auth = useAuth();

  if (!auth) {
    return <div>Auth context is not available!</div>;
  }

  // Show sign in or sign out button based on authentication state
  const authenticationButton = auth.isAuthenticated ? (
    <button
      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor:pointer"
      onClick={() => {
        auth.removeUser(); // This is not exactly right, it kills the user locally orphaning the session.
        logoutToCognito(); // We should be using auth.sigoutRedirect() but that is not working.
      }}
    >
      Sign Out
    </button>
  ) : (
    <button
      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor:pointer"
      onClick={() => auth.signinRedirect()}
    >
      Sign In
    </button>
  );


  return (
    <div className="border-2 border-gray-300 p-4 rounded-lg">
      <button
        onClick={() => (window.location.href = "/")}
        className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to Home
      </button>
      <DebugOnly>
        <AuthDebug />
      </DebugOnly>
      {authenticationButton}
    </div>
  );
};

export default AuthComponent;
