import React from "react";

import {
  BaseButton,
  ButtonSize,
} from "./BaseButton";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  className?: string;
}

export const PrimaryButton: React.FC<Props> = ({
  size = "standard",
  className = "",
  children,
  ...rest
}) => (
  <BaseButton
    size={size}
    className={`bg-[var(--color-action)] text-white hover:bg-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-action-focus)] rounded-md ${className}`}
    {...rest}
  >
    {children}
  </BaseButton>
);
