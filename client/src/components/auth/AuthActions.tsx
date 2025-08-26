import { useAuth } from "react-oidc-context";
import { logout } from "router/cognitoConfig";

export function useAuthActions() {
  const auth = useAuth();
  const signIn = () => auth.signinRedirect();
  const signOut = () => {
    auth.removeUser();
    logout();
  };

  return {
    signIn,
    signOut,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
  };
}
