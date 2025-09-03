import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  // IF the session still exists on the IDP. this will log you in immediately.
  const auth = useAuth();
  const kicked = useRef(false);

  const processing = !!auth.activeNavigator || auth.isLoading;

  useEffect(() => {
    // So let's check the logout flag to see if "just logged out"
    const justLoggedOut = sessionStorage.getItem("justLoggedOut") === "1";
    if (justLoggedOut) {
      sessionStorage.removeItem("justLoggedOut");
      return; // this basically kills the loop of fetching the token.
    }

    if (!processing && !auth.isAuthenticated && !kicked.current) {
      kicked.current = true;
      auth.signinRedirect({
        state: { returnUrl: window.location.pathname + window.location.search },
      }).catch(() => { kicked.current = false; });
    }
  }, [processing, auth.isAuthenticated, auth.signinRedirect]);

  if (processing || !auth.isAuthenticated) return null;

  return <>{children}</>;
}
