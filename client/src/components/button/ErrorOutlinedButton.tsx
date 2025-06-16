import React from "react";

import {
  BaseButton,
  ButtonSize,
} from "./BaseButton";

interface Props {
  type?: "button" | "submit" | "reset";
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
}

export const ErrorOutlinedButton: React.FC<Props> = ({
  type = "button",
  size = "standard",
  disabled = false,
  onClick,
  children,
  className = "",
}) => (
  <BaseButton
    type={type}
    size={size}
    disabled={disabled}
    onClick={onClick}
    className={`bg-white text-[var(--color-error)] border border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white focus:ring-2 focus:ring-[var(--color-error-lightest)] rounded-md ${className}`}
  >
    {children}
  </BaseButton>
);
