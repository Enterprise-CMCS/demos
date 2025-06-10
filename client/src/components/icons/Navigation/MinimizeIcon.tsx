import React from "react";

import { IconInput } from "../Icon";
export const MinimizeIcon = ({
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
    <rect x="2.25" y="6.125" width="10.5" height="1.3125" fill="currentColor" />
  </svg>
);
