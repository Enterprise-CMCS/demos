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
focus:ring-action-focus

disabled:border-none

[aria-disabled='true']:border-none
[aria-disabled='true']:hover:bg-white
[aria-disabled='true']:focus:ring-0
`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const CircleButton: React.FC<Props> = (props) => (
  <BaseButton {...props} isCircle={true} className={CLASSES}>
    {props.children}
  </BaseButton>
);
