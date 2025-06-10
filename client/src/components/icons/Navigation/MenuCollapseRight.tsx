import React from "react";

import { IconInput } from "../Icon";
export const MenuCollapseRight = ({
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
      d="M13.5 14L13.5 -8.74227e-08L14.5 0L14.5 14L13.5 14Z"
      fill="currentColor"
    />
    <path
      d="M0.500002 6.99984C0.500002 6.71168 0.715737 6.47809 0.98186 6.47809L9.84952 6.47809L7.45971 3.89044C7.27154 3.68668 7.27154 3.35633 7.45971 3.15257C7.64789 2.94882 7.95299 2.94882 8.14117 3.15257L11.3536 6.63091C11.597 6.99984 11.494 7.21664 11.3532 7.36912L8.14117 10.8471C7.95299 11.0509 7.64789 11.0509 7.45971 10.8471C7.27154 10.6433 7.27154 10.313 7.45971 10.1092L9.84952 7.52159L0.98186 7.52159C0.715737 7.52159 0.500002 7.28799 0.500002 6.99984Z"
      fill="currentColor"
    />
  </svg>
);
