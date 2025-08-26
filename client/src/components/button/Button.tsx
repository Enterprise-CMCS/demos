import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-action 
text-white 
hover:bg-brand

focus:ring-action-focus
focus:ring-2`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const Button: React.FC<Props> = (props) => (
  <BaseButton {...props} className={CLASSES}>
    {props.children}
  </BaseButton>
);
