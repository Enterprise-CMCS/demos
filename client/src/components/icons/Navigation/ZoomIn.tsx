import React from "react";

import { IconInput } from "../Icon";
export const ZoomIn = ({
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
      d="M8.1349 7.30178e-08L8.1349 14H6.46444L6.46444 0L8.1349 7.30178e-08Z"
      fill="currentColor"
    />
    <path
      d="M0.498535 6.36364H14.4985V8.03409H0.498535V6.36364Z"
      fill="currentColor"
    />
  </svg>
);
