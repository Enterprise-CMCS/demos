import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { SigninButton } from "components/auth/AuthButtons";

export function SignedOut() {
  const auth = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      console.log("SignedOut: already ran, skipping");
      return;
    }
    ran.current = true;
    // keep the flag set while we’re on this page so RequireAuth won’t auto-login
    sessionStorage.setItem("justLoggedOut", "1");
  }, [auth]);

  // clear the flag when leaving this page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("justLoggedOut");
    };
  }, []);

  return (
    <div className="p-6">
      <h1>You&apos;ve signed out</h1>
      <p>You can safely close this tab or sign in again.</p>
      <SigninButton />
    </div>
  );
}
