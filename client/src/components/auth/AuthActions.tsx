import { useAuth } from "react-oidc-context";
import { logoutRedirect } from "router/cognitoConfig";

export function useAuthActions() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    try {
      await auth.signoutSilent();
      await auth.removeUser();
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
