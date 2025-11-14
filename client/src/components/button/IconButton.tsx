import React from "react";

import { SecondaryButton } from "./SecondaryButton";
import { ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

// Standard icon sizes for consistency
const ICON_SIZE = tw`w-[20px] h-[20px]`;

interface IconButtonProps extends Omit<ButtonProps, "className" | "isCircle" | "children"> {
  icon: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconPosition = "right",
  children,
  ...props
}) => {
  // Standardize icon sizing
  const standardizedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
      className: ICON_SIZE,
    })
    : icon;

  return (
    <SecondaryButton {...props}>
      {iconPosition === "left" && standardizedIcon}
      {children && <span>{children}</span>}
      {iconPosition === "right" && standardizedIcon}
    </SecondaryButton>
  );
};
