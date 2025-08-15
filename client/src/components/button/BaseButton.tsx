import React from "react";
import { tw } from "tags/tw";

export type ButtonSize = "small" | "standard" | "large";
export type ButtonType = "button" | "submit" | "reset";

const BASE_BUTTON_STYLES = tw`
inline-flex
items-center
justify-center

font-semibold

focus:outline-none
transition-all
cursor-pointer

disabled:bg-surface-disabled
disabled:text-text-placeholder
disabled:cursor-not-allowed`;

const getSizeClasses = (isCircle: boolean, buttonSize: ButtonSize) => {
  if (isCircle) {
    return {
      large: "w-14 h-14 text-[1.4rem] font-semibold leading-none",
      small: "w-8 h-8 text-[1rem] font-medium leading-none",
      standard: "w-12 h-12 text-[1.2rem] font-semibold leading-none",
    }[buttonSize];
  }
  return {
    large: "text-[1.6rem] font-semibold px-6 py-3 leading-tight tracking-wide",
    small: "text-[1.2rem] font-medium px-1 py-1 leading-tight tracking-wide",
    standard: "text-[1.4rem] font-medium px-4 py-2 leading-tight tracking-wide",
  }[buttonSize];
};

const getCircleClasses = (isCircle: boolean) => {
  return isCircle ? "rounded-full" : "rounded-md";
};

export interface ButtonProps {
  name?: string;
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
