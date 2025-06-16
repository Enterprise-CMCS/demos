import React from "react";

import {
  BaseButton,
  ButtonSize,
} from "./BaseButton";

interface Props {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
}

export const PrimaryButton: React.FC<Props> = ({
  size = "standard",
  disabled = false,
  onClick,
  children,
  className = "",
}) => (
  <BaseButton
    size={size}
    disabled={disabled}
    onClick={onClick}
    className={`bg-[var(--color-action)] text-white hover:bg-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-md ${className}`}
  >
    {children}
  </BaseButton>
);
