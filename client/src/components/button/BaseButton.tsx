import React from "react";

export type ButtonSize = "small" | "standard" | "large";

interface BaseButtonProps {
  type?: "button" | "submit" | "reset";
  form?: string;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  type = "button",
  form,
  size = "standard",
  disabled = false,
  onClick,
  className = "",
  children,
  "data-testid": dataTestId,
}) => {
  const isCircle = className?.includes("rounded-full");

  const sizeClass = isCircle
    ? {
      large: "w-14 h-14 text-[1.4rem] font-semibold leading-none",
      small: "w-8 h-8 text-[1rem] font-medium leading-none",
      standard: "w-12 h-12 text-[1.2rem] font-semibold leading-none",
    }[size]
    : {
      large: "text-[1.6rem] font-semibold px-6 py-3 leading-tight tracking-wide",
      small: "text-[1.2rem] font-medium px-1 py-1 leading-tight tracking-wide",
      standard: "text-[1.4rem] font-medium px-4 py-2 leading-tight tracking-wide",
    }[size];

  const base =
    "inline-flex items-center justify-center focus:outline-none transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed";

  return (
    <button
      type={type}
      form={form}
      className={`${base} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      data-testid={dataTestId}
    >
      {children}
    </button>
  );
};
