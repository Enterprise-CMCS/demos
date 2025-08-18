import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-white
text-text-active

hover:bg-surface-hover
hover:text-text-brand

focus:bg-white
focus:bg-text-active
focus:border
focus:border-brand
`;

type Props = Omit<ButtonProps, "className" | "isCircle">;
export const TertiaryButton: React.FC<Props> = (props) => (
  <BaseButton {...props} className={CLASSES}>
    {props.children}
  </BaseButton>
);
