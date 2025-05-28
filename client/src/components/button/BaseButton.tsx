import React from "react";

export type ButtonSize = "standard" | "large";

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

  const sizeClass = isCircle
    ? size === "large"
      ? "w-14 h-14 text-[1.4rem] font-semibold leading-none"
      : "w-12 h-12 text-[1.2rem] font-semibold leading-none"
    : size === "large"
      ? "text-[1.6rem] font-semibold px-6 py-3 leading-tight tracking-wide"
      : "text-[1.4rem] font-medium px-4 py-2 leading-tight tracking-wide";

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
