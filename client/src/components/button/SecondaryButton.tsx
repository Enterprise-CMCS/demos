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
  "data-testid"?: string;
}

export const SecondaryButton: React.FC<Props> = ({
  type = "button",
  size = "standard",
  disabled = false,
  onClick,
  children,
  className = "",
  "data-testid": dataTestId,
}) => (
  <BaseButton
    type={type}
    size={size}
    disabled={disabled}
    onClick={onClick}
    className={`bg-white text-[var(--color-action)] border border-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-md ${className}`}
    data-testid={dataTestId}
  >
    {children}
  </BaseButton>
);
