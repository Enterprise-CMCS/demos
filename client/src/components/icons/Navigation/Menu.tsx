import React from "react";

import { IconInput } from "../Icon";
export const Menu = ({
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
    <rect x="1.5" y="6.3125" width="12" height="1.3125" fill="currentColor" />
    <rect x="1.5" y="1" width="12" height="1.3125" fill="currentColor" />
    <rect x="1.5" y="11.625" width="12" height="1.3125" fill="currentColor" />
  </svg>
);
