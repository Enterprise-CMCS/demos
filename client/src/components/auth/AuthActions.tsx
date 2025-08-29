import { useAuth } from "react-oidc-context";
import { getCognitoConfig, getCognitoLogoutUrl } from "router/cognitoConfig";

export function useAuthActions() {
  const auth = useAuth();
  const signIn = () => auth.signinRedirect();
  const signOut = async () => {
    try { await auth.removeUser(); } catch {}
    const url = getCognitoLogoutUrl(getCognitoConfig());
    window.location.assign(url);
  };

  return { signIn, signOut, isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading, user: auth.user };
}
