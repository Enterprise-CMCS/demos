import { useAuth } from "react-oidc-context";

export function useAuthActions() {
  const auth = useAuth();

  const signIn = () => auth.signinRedirect();

  const signOut = async () => {
    try {
      await auth.removeUser();
      await auth.signoutRedirect({
        extraQueryParams: {
          // Cognito expect logout_uri, not post_logout_redirect_uri
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
