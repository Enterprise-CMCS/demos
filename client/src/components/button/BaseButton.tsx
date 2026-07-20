import React, { useId, useRef } from "react";
import { tw } from "tags/tw";
import { Tooltip } from "components/tooltip";

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
    large: "h-[48px] text-[16px] py-[8px] px-[16px]",
    small: "h-[40px] text-[14px] py-[8px] px-[16px]",
    standard: "h-[40px] text-[14px] py-[8px] px-[16px]",
  }[buttonSize];
};

const getCircleClasses = (isCircle: boolean) => {
  return isCircle ? "rounded-full" : "rounded-md";
};

export interface ButtonProps {
  name: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className: string;
  "aria-label"?: string;
  type?: ButtonType;
  form?: string;
  size?: ButtonSize;
  disabled?: boolean;
  isCircle?: boolean;
  tooltip?: string;
  eagerTooltip?: string;
}

export const BaseButton: React.FC<ButtonProps> = ({
  name,
  onClick,
  children,
  form,
  className,
  "aria-label": ariaLabel,
  type = "button",
  size = "standard",
  disabled = false,
  isCircle = false,
  tooltip,
  eagerTooltip,
}) => {
  const sizeClasses = getSizeClasses(isCircle, size);
  const circleClasses = getCircleClasses(isCircle);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const anchorName = `--btn-${uid}`;
  const tooltipId = `eager-tooltip-${uid}`;
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        name={name}
        data-testid={name}
        aria-label={ariaLabel || name}
        aria-describedby={eagerTooltip ? tooltipId : undefined}
        type={type}
        onClick={onClick}
        {...(form ? { form } : {})}
        className={`${BASE_BUTTON_STYLES} ${sizeClasses} ${circleClasses} ${className}${eagerTooltip ? " [anchor-name:var(--anchor)]" : ""}`}
        disabled={disabled}
        {...(tooltip ? { title: tooltip } : {})}
        {...(eagerTooltip ? { style: { "--anchor": anchorName } as React.CSSProperties } : {})}
      >
        {children}
      </button>
      {eagerTooltip && (
        <Tooltip id={tooltipId} anchorName={anchorName} anchorRef={buttonRef}>
          {eagerTooltip}
        </Tooltip>
      )}
    </>
  );
};
