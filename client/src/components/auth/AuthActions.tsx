import { useAuth } from "react-oidc-context";
import { logoutRedirect } from "router/cognitoConfig";

export function useAuthActions() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    // Attribute for RequireAuth to not redirect to /authorize.
    sessionStorage.setItem("justLoggedOut", "1");
    try {
      auth.signinSilent?.();
      auth.removeUser();
    } catch (error) {
      console.warn("[Logout] logout failed", error);
    }
    logoutRedirect();
  };

  return {
    signIn,
    signOut,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
  };
}
