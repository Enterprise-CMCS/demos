import React from "react";

import { IconInput } from "../Icon";
export const Review = ({
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
      d="M10.5995 6.125L8.16169 3.0625L9.13682 1.8375L10.5995 3.675L13.5249 0L14.5 1.225L10.5995 6.125ZM6.76866 2.625H0.5V4.375H6.76866V2.625ZM13.7338 8.225L12.7587 7L10.9478 9.275L9.13682 7L8.16169 8.225L9.97264 10.5L8.16169 12.775L9.13682 14L10.9478 11.725L12.7587 14L13.7338 12.775L11.9229 10.5L13.7338 8.225ZM6.76866 9.625H0.5V11.375H6.76866V9.625Z"
      fill="currentColor"
    />
  </svg>
);
