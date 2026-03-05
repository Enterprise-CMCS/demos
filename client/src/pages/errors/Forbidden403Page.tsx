import React from "react";
import { ErrorPage } from "./ErrorPage";
import { useAuthActions } from "components/auth/AuthActions";

export const Forbidden403Page: React.FC = () => {
  const { signIn, signOut } = useAuthActions();

  const handleSignIn = () => {
    signOut();
    signIn();
  };

  return (
    <ErrorPage
      code={403}
      title="403 &ndash; Forbidden"
      message="You do not have permission to access this resource."
      actions={[{ label: "Sign in", onClick: handleSignIn }]}
    />
  );
};
