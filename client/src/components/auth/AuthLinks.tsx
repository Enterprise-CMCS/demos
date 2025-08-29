import React from "react";
import { useAuthActions } from "./AuthActions";

export function SigninLink(): React.ReactElement {
  const { signIn } = useAuthActions();
  return (
    <button type="button" onClick={signIn}>
      Sign In
    </button>
  );
}

export function SignoutLink(): React.ReactElement {
  const { signOut } = useAuthActions();
  return (
    <button type="button" onClick={signOut}>
      Sign Out
    </button>
  );
}
