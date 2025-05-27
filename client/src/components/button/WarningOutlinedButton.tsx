import React from "react";
import { BaseButton, ButtonSize } from "./BaseButton";

interface Props {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
}

export const WarningOutlinedButton: React.FC<Props> = ({
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
    className={`bg-white text-[var(--color-warn)] border border-[var(--color-warn)] hover:bg-[var(--color-warn)] hover:text-black focus:ring-2 focus:ring-[var(--color-warn-lightest)] rounded-md ${className}`}
  >
    {children}
  </BaseButton>
);
