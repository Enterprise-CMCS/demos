import React from "react";
import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-white
text-action
border
border-action
hover:bg-action-hover
focus:ring-2
focus:ring-action-focus`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const CircleButton: React.FC<Props> = ({ name, children, size, disabled, onClick }) => (
  <BaseButton
    name={name}
    size={size}
    disabled={disabled}
    onClick={onClick}
    isCircle={true}
    className={CLASSES}
  >
    {children}
  </BaseButton>
);
