import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-white
text-action
border
border-action
gap-1

hover:bg-action
hover:text-white

focus:ring-2
focus:ring-action-focus

disabled:bg-white
disabled:border-border-rules
disabled:text-text-placeholder
`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const SecondaryButton: React.FC<Props> = (props) => (
  <BaseButton {...props} className={CLASSES}>
    {props.children}
  </BaseButton>
);
