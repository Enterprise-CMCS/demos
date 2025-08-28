import React from "react";
import { useAuthActions } from "./AuthActions";

export function SigninLink(): React.ReactElement {
  const { signIn } = useAuthActions();
  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        signIn();
      }}
    >
    Sign In
    </a>
  );
}

export function SignoutLink(): React.ReactElement {
  const { signOut } = useAuthActions();
  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        signOut();
      }}
    >
      Sign Out
    </a>
  );
}
