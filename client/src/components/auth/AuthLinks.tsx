import React from "react";
import { useAuthActions } from "./AuthActions";

export function SigninLink() {
  const { signIn } = useAuthActions();
  return (
    <li className="cursor-pointer"
      onClick={(signInEvent) => {
        signInEvent.preventDefault();
        signInEvent.stopPropagation();
        signIn();
      }}
    >
      Sign In
    </li>
  );
}

export function SignoutLink() {
  const { signOut } = useAuthActions();
  return (
    <li className="cursor-pointer"
      onClick={(signOutEvent) => {
        signOutEvent.preventDefault();
        signOutEvent.stopPropagation();
        signOut();
      }}
    >
      Sign Out
    </li>
  );
}
