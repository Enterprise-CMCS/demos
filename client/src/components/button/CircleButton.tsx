import React from "react";
import { BaseButton, ButtonSize } from "./BaseButton";

interface Props {
  children: React.ReactNode;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  className?: string;
}

export const CircleButton: React.FC<Props> = ({
  children,
  size = "standard",
  disabled = false,
  onClick,
  ariaLabel,
  className = "",
}) => (
  <BaseButton
    size={size}
    disabled={disabled}
    onClick={onClick}
    ariaLabel={ariaLabel}
    className={`bg-white text-[var(--color-action)] border border-[var(--color-action)] hover:bg-[var(--color-action-hover)] focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-full ${className}`}
  >
    {children}
  </BaseButton>
);
