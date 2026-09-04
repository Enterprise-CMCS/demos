import { useAuth } from "react-oidc-context";

function clearWebStorage() {
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }
}

export function useAuthActions() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    try {
      clearWebStorage();

      await auth.signoutRedirect({
        extraQueryParams: {
          // Cognito expects logout_uri, not post_logout_redirect_uri
          logout_uri: `${window.location.origin}/`,
          client_id: import.meta.env.VITE_COGNITO_CLIENT_ID!,
        },
      });
    } catch (error) {
      console.warn("[Logout] logout failed", error);
    }
  };

  return {
    signIn,
    signOut,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
  };
}
