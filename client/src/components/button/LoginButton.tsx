import React from "react";
import { PrimaryButton } from "./PrimaryButton";

export interface LoginButtonProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A specialized primary button for logging in.
 * Wraps a PrimaryButton in an anchor for navigation.
 */
export const LoginButton: React.FC<LoginButtonProps> = ({
  href = "/login",
  children = "Login",
}) => (
  <a href={href}>
    <PrimaryButton className="mt-4">
      {children}
    </PrimaryButton>
  </a>
);

export default LoginButton;
