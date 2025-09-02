import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation, useNavigate } from "react-router-dom";

const PUBLIC_PATHS = new Set(["/sign-out"]); // public routes.

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const kicked = useRef(false);
  const cleaned = useRef(false);

  const path = location.pathname;
  const search = location.search || "";

  // Leave logout page alone.
  if (PUBLIC_PATHS.has(path)) return <>{children}</>;

  const isCallbackQuery =
    search.includes("code=") || search.includes("id_token=") || search.includes("access_token=");

  const finishingNavigator =
    auth.activeNavigator === "signinRedirect" || auth.activeNavigator === "signinSilent";

  useEffect(() => {
    if ((isCallbackQuery || finishingNavigator) && !auth.isLoading && !cleaned.current) {
      cleaned.current = true;
      const cleanUrl = location.pathname + location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      navigate(cleanUrl, { replace: true });
    }
  }, [isCallbackQuery, finishingNavigator, auth.isLoading, location.pathname, location.hash, navigate]);

  useEffect(() => {
    /* Always try to login, unleess you just logged out */
    const justLoggedOut = sessionStorage.getItem("justLoggedOut") === "1";
    if (justLoggedOut) return;

    if (!auth.isLoading && !auth.isAuthenticated && !isCallbackQuery && !finishingNavigator && !kicked.current) {
      kicked.current = true;
      auth.signinRedirect({ state: { returnUrl: location.pathname + location.search } }).catch(() => {});
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.signinRedirect, isCallbackQuery, finishingNavigator, location]);

  const stillCleaning = (isCallbackQuery || finishingNavigator) && !auth.isLoading && !cleaned.current;
  if (auth.isLoading || finishingNavigator || stillCleaning) return <div style={{ display: "none" }} />;
  if (!auth.isAuthenticated) return <div style={{ display: "none" }} />;

  // authenticated; if flag somehow remained, clear it now
  if (sessionStorage.getItem("justLoggedOut") === "1") sessionStorage.removeItem("justLoggedOut");

  return <>{children}</>;
}
