import React from "react";
import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
text-text-font

focus:ring-2
focus:ring-warn-lightest

disabled: border-none
`;

const getColorClasses = (isOutlined: boolean) => {
  if (isOutlined) {
    return tw`bg-white border border-warn hover:bg-warn-light focus:bg-warn-light`;
  }
  return tw`bg-warn hover:bg-surface-warn`;
};

type Props = Omit<ButtonProps, "className" | "isCircle"> & {
  isOutlined?: boolean;
};
export const WarningButton: React.FC<Props> = (props) => {
  const colorClasses = getColorClasses(props.isOutlined || false);

  return (
    <BaseButton {...props} className={`${CLASSES} ${colorClasses}`}>
      {props.children}
    </BaseButton>
  );
};
