// src/components/auth/RequireAuth.tsx
import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const kickedOff = useRef(false);

  // Are we on the OIDC callback URL? (Hosted UI returns with ?code=...&state=...)
  const isOidcCallback = new URLSearchParams(location.search).has("code");

  // Helpful one-liner while you stabilize:
  if (import.meta.env.DEV) {
    // activeNavigator tells you if react-oidc-context is currently handling a redirect
    console.table({
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      activeNavigator: auth.activeNavigator ?? "<none>",
      path: location.pathname + location.search,
      isOidcCallback,
    });
  }

  useEffect(() => {
    // Don’t trigger while library is handling a redirect or during callback
    if (auth.isLoading || auth.activeNavigator || isOidcCallback) return;

    if (!auth.isAuthenticated && !kickedOff.current) {
      kickedOff.current = true;
      auth
        .signinRedirect({
          // send them back where they started
          state: { returnUrl: location.pathname + location.search },
        })
        .catch((e) => console.error("[RequireAuth] signinRedirect failed:", e));
    }
  }, [
    auth,
    auth.isLoading,
    auth.activeNavigator,
    auth.isAuthenticated,
    isOidcCallback,
    location.pathname,
    location.search,
  ]);

  // While loading or callback in progress: render a tiny filler to avoid blank page
  if (auth.isLoading || auth.activeNavigator || isOidcCallback) {
    return <div style={{ height: 1 }} />; // or a spinner
  }

  // If unauthenticated, redirect has been kicked off. Render nothing.
  if (!auth.isAuthenticated) return null;

  return <>{children}</>;
}
