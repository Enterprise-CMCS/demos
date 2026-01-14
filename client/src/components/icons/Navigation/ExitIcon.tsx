import React from "react";

import { IconInput } from "../Icon";

interface ExitIconProps extends IconInput {
  includeStroke?: boolean;
}

export const ExitIcon: React.FC<ExitIconProps> = ({
  label = "Exit",
  width = "15",
  height = "15",
  viewBox = "0 0 15 15",
  className = "",
  includeStroke = false,
}: ExitIconProps = {}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={label}
    role="img"
    stroke="currentColor"
  >
    <path
      d="M8.39091 7L14.3091 1.08182C14.5636 0.827273 14.5636 0.445455 14.3091 0.190909C14.0545 -0.0636364 13.6727 -0.0636364 13.4182 0.190909L7.5 6.10909L1.58182 0.190909C1.32727 -0.0636364 0.945455 -0.0636364 0.690909 0.190909C0.436364 0.445455 0.436364 0.827273 0.690909 1.08182L6.60909 7L0.690909 12.9182C0.436364 13.1727 0.436364 13.5545 0.690909 13.8091C0.818182 13.9364 0.945455 14 1.13636 14C1.32727 14 1.45455 13.9364 1.58182 13.8091L7.5 7.89091L13.4182 13.8091C13.5455 13.9364 13.7364 14 13.8636 14C13.9909 14 14.1818 13.9364 14.3091 13.8091C14.5636 13.5545 14.5636 13.1727 14.3091 12.9182L8.39091 7Z"
      fill="currentColor"
      stroke={includeStroke ? "currentColor" : "none"}
      strokeWidth={includeStroke ? "0.8" : "0"}
      strokeLinejoin="round"
    />
  </svg>
);
