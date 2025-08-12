import React from "react";

import { IconInput } from "../Icon";
export const SortIcon: React.FC<IconInput> = ({
  label = "Sort Icon",
  width = "9",
  height = "17",
  viewBox = "0 0 9 16",
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
      d="M4.5 2.51556L7.26253 5.33333L8.49129 4.08L4.5 0L0.5 4.08L1.73747 5.33333L4.5 2.51556ZM4.5 13.4844L1.73747 10.6667L0.508715 11.92L4.5 16L8.5 11.92L7.26253 10.6667L4.5 13.4844Z"
      fill="currentColor"
    />
  </svg>
);
