import React from "react";
import { useAuthActions } from "./AuthActions";

export function SigninLink() {
  const { signIn } = useAuthActions();
  return (
    <button
      type="button"
      className="w-full text-left cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void signIn();
      }}
    >
      Sign In
    </button>
  );
}

export function SignoutLink() {
  const { signOut } = useAuthActions();
  return (
    <button
      type="button"
      className="w-full text-left cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void signOut();
      }}
    >
      Sign Out
    </button>
  );
}
