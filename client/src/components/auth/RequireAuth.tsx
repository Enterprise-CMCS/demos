import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const kickedOff = useRef(false);

  // Always call hooks. Do redirects inside an effect.
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !kickedOff.current) {
      kickedOff.current = true;
      auth.signinRedirect({
        state: { returnUrl: location.pathname + location.search },
      });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.signinRedirect, location]);

  // After hooks, decide what to render
  if (auth.isLoading || !auth.isAuthenticated) return null;
  return <>{children}</>;
}
