import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-transparent
text-action
border
border-action
hover:bg-action
hover:text-white
focus:ring-2
focus:ring-action-focus`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const TertiaryButton: React.FC<Props> = ({
  name,
  type,
  size,
  disabled,
  onClick,
  children,
}) => (
  <BaseButton
    name={name}
    type={type}
    size={size}
    disabled={disabled}
    onClick={onClick}
    className={CLASSES}
  >
    {children}
  </BaseButton>
);
