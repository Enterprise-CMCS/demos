import React from "react";
import { Button } from "components/button/Button";
import { useAuthActions } from "./AuthActions";

/**
 * Remove `onClick` from the props passed to SigninButton,
 * so only the internal `signIn` handler is used.
 */
export function SigninButton(): React.ReactElement {
  const { signIn } = useAuthActions();
  return (
    <Button name="sign-in" onClick={signIn}>
      Sign In
    </Button>
  );
}
export function SignoutButton(): React.ReactElement {
  const { signOut } = useAuthActions();
  return (
    <Button name="sign-out" onClick={signOut}>
      Sign Out
    </Button>
  );
}
