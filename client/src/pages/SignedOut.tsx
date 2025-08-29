// /sign-out
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export function SignedOut() {
  const auth = useAuth();
  useEffect(() => {
    const t = setTimeout(() => auth.signinRedirect(), 600);
    return () => clearTimeout(t);
  }, [auth]);
  return <div>You&apos;ve signed out. Redirecting...</div>;
}
