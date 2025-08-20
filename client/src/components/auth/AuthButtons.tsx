import React from "react";
import { Button } from "components/button/Button";
import { useAuthActions } from "./AuthActions";

type Props = React.ComponentProps<typeof Button>;

export const SigninButton: React.FC<Props> = ({ children = "Sign In", onClick, ...rest }) => {
  const { signIn } = useAuthActions();
  return (
    <Button onClick={signIn} {...rest}>
      {children}
    </Button>
  );
};

export const SignoutButton: React.FC<Props> = ({ children = "Sign Out", onClick, ...rest }) => {
  const { signOut } = useAuthActions();
  return (
    <Button onClick={signOut} {...rest}>
      {children}
    </Button>
  );
};
