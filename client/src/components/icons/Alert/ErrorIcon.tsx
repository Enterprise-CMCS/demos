import React from "react";

import { IconInput } from "../Icon";
export const ErrorIcon: React.FC<IconInput> = ({
  label = "Error",
  width = "21",
  height = "21",
  viewBox = "0 0 21 21",
  className = "",
}: IconInput = {}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={label}
    role="img"
  >
    <circle cx="10.5" cy="10" r="10" fill="#E31C3D" />
    <path
      d="M9.75 5.75L9.75 10.25C9.75 10.6642 10.0858 11 10.5 11C10.9142 11 11.25 10.6642 11.25 10.25L11.25 5.75C11.25 5.33579 10.9142 5 10.5 5C10.0858 5 9.75 5.33579 9.75 5.75Z"
      fill="white"
    />
    <path
      d="M9.5 13C9.5 13.5523 9.94772 14 10.5 14C11.0523 14 11.5 13.5523 11.5 13C11.5 12.4477 11.0523 12 10.5 12C9.94772 12 9.5 12.4477 9.5 13Z"
      fill="white"
    />
  </svg>
);
