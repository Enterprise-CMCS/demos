// src/components/LoginButton.tsx
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
  children = "Log In",
  className = "",
}) => (
  <a href={href}>
    <PrimaryButton className={className}>
      {children}
    </PrimaryButton>
  </a>
);

export default LoginButton;
