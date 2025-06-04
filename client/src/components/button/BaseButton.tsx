import React from "react";

export type ButtonSize = "small" | "standard" | "large";

interface BaseButtonProps {
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children: React.ReactNode;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  size = "standard",
  disabled = false,
  onClick,
  className = "",
  children,
}) => {
  const isCircle = className?.includes("rounded-full");

  let sizeClass = "";

  if (isCircle) {
    if (size === "large") {
      sizeClass = "w-14 h-14 text-[1.4rem] font-semibold leading-none";
    } else if (size === "small") {
      sizeClass = "w-8 h-8 text-[1rem] font-medium leading-none";
    } else {
      sizeClass = "w-12 h-12 text-[1.2rem] font-semibold leading-none";
    }
  } else {
    if (size === "large") {
      sizeClass = "text-[1.6rem] font-semibold px-6 py-3 leading-tight tracking-wide";
    } else if (size === "small") {
      sizeClass = "text-[1.2rem] font-medium px-1 py-1 leading-tight tracking-wide";
    } else {
      sizeClass = "text-[1.4rem] font-medium px-4 py-2 leading-tight tracking-wide";
    }
  }

  const base =
    "inline-flex items-center justify-center focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      className={`${base} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
