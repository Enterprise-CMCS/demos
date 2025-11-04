import React from "react";
import { tw } from "tags/tw";

export type ButtonSize = "small" | "standard" | "large";
export type ButtonType = "button" | "submit" | "reset";

const BASE_BUTTON_STYLES = tw`
inline-flex
items-center
justify-center
gap-xs

font-semibold

focus:outline-none
transition-all
cursor-pointer

disabled:bg-surface-disabled
disabled:text-text-placeholder
disabled:cursor-not-allowed

py-[8px]
px-[16px]
`;

const getSizeClasses = (isCircle: boolean, buttonSize: ButtonSize) => {
  if (isCircle) {
    return {
      large: "w-14 h-14 text-[1.4rem]",
      small: "w-8 h-8 text-[1rem]",
      standard: "w-12 h-12 text-[1.2rem]",
    }[buttonSize];
  }
  return {
    large: "h-[48px] text-[16px]",
    small: "h-[40px] text-[14px]",
    standard: "h-[40px] text-[14px]",
  }[buttonSize];
};

const getCircleClasses = (isCircle: boolean) => {
  return isCircle ? "rounded-full" : "rounded-md";
};

export interface ButtonProps {
  name: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className: string;
  ariaLabel?: string;
  type?: ButtonType;
  form?: string;
  size?: ButtonSize;
  disabled?: boolean;
  isCircle?: boolean;
}

export const BaseButton: React.FC<ButtonProps> = ({
  name,
  onClick,
  children,
  form,
  className,
  ariaLabel,
  type = "button",
  size = "standard",
  disabled = false,
  isCircle = false,
}) => {
  const sizeClasses = getSizeClasses(isCircle, size);
  const circleClasses = getCircleClasses(isCircle);

  return (
    <button
      name={name}
      data-testid={name}
      aria-label={ariaLabel || name}
      type={type}
      onClick={onClick}
      {...(form ? { form } : {})}
      className={`${BASE_BUTTON_STYLES} ${sizeClasses} ${circleClasses} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
