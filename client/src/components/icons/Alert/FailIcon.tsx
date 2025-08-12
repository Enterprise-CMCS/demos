import React from "react";

import { IconInput } from "../Icon";
export const FailIcon: React.FC<IconInput> = ({
  label = "Fail",
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
    <path
      d="M10.5 0C16.03 0 20.5 4.47 20.5 10C20.5 15.53 16.03 20 10.5 20C4.97 20 0.5 15.53 0.5 10C0.5 4.47 4.97 0 10.5 0ZM14.09 5L10.5 8.59L6.91 5L5.5 6.41L9.09 10L5.5 13.59L6.91 15L10.5 11.41L14.09 15L15.5 13.59L11.91 10L15.5 6.41L14.09 5Z"
      fill="#E31C3D"
    />
  </svg>
);
