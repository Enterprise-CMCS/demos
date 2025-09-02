// AuthActions.tsx
import { useAuth } from "react-oidc-context";
import { getCognitoConfig, getCognitoLogoutUrl } from "router/cognitoConfig";

let signingOut = false;

export function useAuthActions() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    if (signingOut) return;
    signingOut = true;
    // prevent RequireAuth from immediately kicking us back to /authorize
    sessionStorage.setItem("justLoggedOut", "1");

    // clear SPA tokens first (so UI flips to logged out instantly)
    try { await auth.removeUser(); } catch {
      console.warn("Failed removeUser");
    }
    const url = getCognitoLogoutUrl(getCognitoConfig());
    window.location.replace(url); // hard-redirect to Cognito Hosted UI logout
  };

  return {
    signIn,
    signOut,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
  };
}
