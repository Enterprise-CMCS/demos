import React from "react";
import { Button } from "components/button/Button";
import { useAuthActions } from "./AuthActions";

export function SigninButton(): React.ReactElement {
  const { signIn } = useAuthActions();
  return (
    <Button name="sign-in" onClick={() => void signIn()}>
      Sign In
    </Button>
  );
};
export function SignoutButton(): React.ReactElement {
  const { signOut } = useAuthActions();
  return (
    <Button name="sign-out" onClick={() => void signOut()}>
      Sign Out
    </Button>
  );
};
