import React from "react";
import { BaseButton, ButtonSize } from "./BaseButton";

interface Props {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
}

export const CircleButton: React.FC<Props> = ({
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
    className={`bg-white text-[var(--color-action)] border border-[var(--color-action)] hover:bg-[var(--color-action-hover)] focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-full ${className}`}
  >
    {children}
  </BaseButton>
);
