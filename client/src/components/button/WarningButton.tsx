import React from "react";
import { BaseButton, ButtonSize } from "./BaseButton";

interface Props {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
}

export const WarningButton: React.FC<Props> = ({
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
    className={`bg-[var(--color-warn)] text-black hover:bg-[var(--color-warn-light)] focus:ring-2 focus:ring-[var(--color-warn-lightest)] rounded-md ${className}`}
  >
    {children}
  </BaseButton>
);
