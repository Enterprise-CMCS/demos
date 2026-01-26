import React from "react";

import { IconInput } from "../Icon";

export const PreSubmissionIcon: React.FC<IconInput> = ({
  label = "Pre-submission",
  width = "24",
  height = "24",
  viewBox = "0 0 24 24",
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
      d="M7.75 22c-0.4 0 -0.75 -0.15 -1.05 -0.45 -0.3 -0.3 -0.45 -0.65 -0.45 -1.05v-2.75H3.5c-0.4 0 -0.75 -0.15 -1.05 -0.45 -0.3 -0.3 -0.45 -0.65 -0.45 -1.05v-1.875h1.5v1.875h2.75v-8.5c0 -0.4 0.15 -0.75 0.45 -1.05 0.3 -0.3 0.65 -0.45 1.05 -0.45h8.5V3.5h-1.875V2h1.875c0.4 0 0.75 0.15 1.05 0.45 0.3 0.3 0.45 0.65 0.45 1.05v2.75H20.5c0.4 0 0.75 0.15 1.05 0.45 0.3 0.3 0.45 0.65 0.45 1.05V20.5c0 0.4 -0.15 0.75 -0.45 1.05 -0.3 0.3 -0.65 0.45 -1.05 0.45H7.75Zm0 -1.5H20.5V7.75H7.75V20.5ZM2 11.875v-4h1.5v4H2Zm0 -6.5V3.5c0 -0.4 0.15 -0.75 0.45 -1.05C2.75 2.15 3.1 2 3.5 2h1.875v1.5H3.5v1.875H2ZM7.875 3.5V2h4v1.5h-4Z"
      fill="currentColor"
    />
  </svg>
);
