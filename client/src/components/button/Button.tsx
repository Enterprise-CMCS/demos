import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-action 
text-white 
hover:bg-brand

focus:ring-action-focus
focus:ring-2`;

const getColorClasses = (isOutlined: boolean) => {
  if (isOutlined) {
    return tw`border bg-brand hover:text-surface-white`;
  } else {
    return tw`text-surface-white`;
  }
};

type Props = Omit<ButtonProps, "className" | "isCircle"> & { isOutlined?: boolean };
export const Button: React.FC<Props> = (props) => {
  const colorClasses = getColorClasses(props.isOutlined || false);

  return (
    <BaseButton {...props} className={`${CLASSES} ${colorClasses}`}>
      {props.children}
    </BaseButton>
  );
};
