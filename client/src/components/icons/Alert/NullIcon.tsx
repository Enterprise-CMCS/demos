import React from "react";

import { IconInput } from "../Icon";
export const NullIcon = ({
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
  >
    <path
      d="M20.5 10C20.5 4.47 16.03 2.41724e-07 10.5 0C4.97 -2.41724e-07 0.5 4.47 0.5 10C0.5 15.53 4.97 20 10.5 20C16.03 20 20.5 15.53 20.5 10Z"
      fill="#AEB0B5"
    />
    <path
      d="M4.42595 10.9978L4.42595 9.00373H16.574L16.574 10.9978H4.42595Z"
      fill="#5B616B"
    />
  </svg>
);
