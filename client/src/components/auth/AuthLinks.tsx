import React from "react";
import { useAuthActions } from "./AuthActions";

export function SigninLink() {
  const { signIn } = useAuthActions();
  return (
    <a
      href="#"
      onClick={(signInEvent) => {
        signInEvent.preventDefault();
        signInEvent.stopPropagation();
        signIn();
      }}
    >
      Sign In
    </a>
  );
}

export function SignoutLink() {
  const { signOut } = useAuthActions();
  return (
    <a
      href="#"
      onClick={(signOutEvent) => {
        signOutEvent.preventDefault();
        signOutEvent.stopPropagation();
        signOut();
      }}
    >
      Sign Out
    </a>
  );
}
