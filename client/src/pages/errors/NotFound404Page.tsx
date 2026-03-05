import React from "react";
import { ErrorPage } from "./ErrorPage";
import { useAuthActions } from "components/auth/AuthActions";

export const NotFound404Page: React.FC = () => {
  const { signIn } = useAuthActions();
  return (
    <ErrorPage
      code={404}
      title="404 &ndash; Not Found"
      message="The resource you are looking for could not be found."
      actions={[{ label: "Sign in", onClick: signIn }]}
    />
  );
};
