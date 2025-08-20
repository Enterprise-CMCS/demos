import React from "react";
import { Button } from "components/button/Button";
import { useAuthActions } from "./AuthActions";

type Props = React.ComponentProps<typeof Button>;

/**
 * Remove `onClick` from the props passed to SigninButton,
 * so only the internal `signIn` handler is used.
 */
export const SigninButton: React.FC<Omit<Props, "onClick">> = ({ children = "Sign In"}) => {
  const { signIn } = useAuthActions();
  return (
    <Button onClick={signIn}>
      {children}
    </Button>
  );
};
export const SignoutButton: React.FC<Omit<Props, "onClick">> = ({ children = "Sign Out"}) => {
  const { signOut } = useAuthActions();
  return (
    <Button onClick={signOut}>
      {children}
    </Button>
  );
};
