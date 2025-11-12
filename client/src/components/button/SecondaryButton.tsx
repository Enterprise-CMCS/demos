import React from "react";

import { BaseButton, ButtonProps } from "./BaseButton";
import { tw } from "tags/tw";

const CLASSES = tw`
bg-white
text-action
border
border-action

hover:bg-action
hover:text-white

focus:ring-2
focus:ring-action-focus

disabled:bg-white
disabled:border-border-rules
disabled:text-text-placeholder
`;

const ICON_SIZE = "w-[20px] h-[20px]";

const processChildren = (
  children: React.ReactNode
): { text: React.ReactNode; icon: React.ReactNode } => {
  let text: React.ReactNode = null;
  let icon: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const props = child.props as { className?: string };
      const isIcon =
        child.type &&
        ((typeof props?.className === "string" &&
          props.className.includes("w-") &&
          props.className.includes("h-")) ||
          child.type === "svg" ||
          (typeof child.type === "function" && child.type.name?.includes("Icon")));

      if (isIcon) {
        icon = React.cloneElement(child as React.ReactElement<{ className?: string }>, {
          className: ICON_SIZE,
        });
      } else {
        text = child;
      }
    } else if (typeof child === "string" || typeof child === "number") {
      text = child;
    }
  });

  return { text, icon };
};

interface SecondaryButtonProps extends Omit<ButtonProps, "className" | "isCircle"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  icon,
  iconPosition = "right",
  children,
  ...props
}) => {
  if (icon) {
    const iconElement = React.isValidElement(icon)
      ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
        className: ICON_SIZE,
      })
      : icon;

    return (
      <BaseButton {...props} className={CLASSES}>
        {iconPosition === "left" && iconElement}
        <span>{children}</span>
        {iconPosition === "right" && iconElement}
      </BaseButton>
    );
  }

  const { text, icon: extractedIcon } = processChildren(children);

  return (
    <BaseButton {...props} className={CLASSES}>
      {text}
      {extractedIcon}
    </BaseButton>
  );
};
