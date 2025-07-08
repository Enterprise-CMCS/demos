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
  form?: string;
}

export const PrimaryButton: React.FC<Props> = ({
  type = "submit",
  size = "standard",
  disabled = false,
  onClick,
  children,
  className = "",
  form,
}) => (
  <BaseButton
    type={type}
    size={size}
    disabled={disabled}
    onClick={onClick}
    form={form}
    className={`bg-[var(--color-action)] text-white hover:bg-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-md ${className}`}
  >
    {children}
  </BaseButton>
);
