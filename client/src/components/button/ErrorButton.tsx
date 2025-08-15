import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
hover:bg-error-dark

focus:ring-2
focus:ring-error-lightest

disabled:border-none
`;

const getColorClasses = (isOutlined: boolean) => {
  if (isOutlined) {
    return tw`bg-surface-white text-error border border-error hover:text-surface-white`;
  } else {
    return tw`bg-error text-surface-white`;
  }
};

type Props = Omit<ButtonProps, "className" | "isCircle"> & { isOutlined?: boolean };
export const ErrorButton: React.FC<Props> = (props) => {
  const colorClasses = getColorClasses(props.isOutlined || false);

  return (
    <BaseButton {...props} className={`${CLASSES} ${colorClasses}`}>
      {props.children}
    </BaseButton>
  );
};
