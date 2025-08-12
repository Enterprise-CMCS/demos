import React from "react";

import { IconInput } from "../Icon";
export const EllipsisIcon: React.FC<IconInput> = ({
  label = "Ellipsis Icon",
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
    <circle cx="2.0127" cy="7" r="1.5" fill="currentColor" />
    <circle cx="7.5127" cy="7" r="1.5" fill="currentColor" />
    <circle cx="13.0127" cy="7" r="1.5" fill="currentColor" />
  </svg>
);
