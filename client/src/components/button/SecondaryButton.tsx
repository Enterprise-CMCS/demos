import React from "react";

import {
  BaseButton,
  ButtonSize,
} from "./BaseButton";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export const SecondaryButton: React.FC<Props> = ({
  size = "standard",
  className = "",
  children,
  ...rest
}) => (
  <BaseButton
    size={size}
    className={`bg-white text-[var(--color-action)] border border-[var(--color-action)] hover:bg-[var(--color-action)] hover:text-white focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-md ${className}`}
    {...rest}
  >
    {children}
  </BaseButton>
);
