import React from "react";

import { IconInput } from "../Icon";
export const Maximize = ({
  width = "15",
  height = "15",
  viewBox = "0 0 15 15",
  className = "",
}: IconInput = {}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.1875 1.3125H1.8125V12.6875H13.1875V1.3125ZM0.5 0V14H14.5V0H0.5Z"
      fill="currentColor"
    />
  </svg>
);
