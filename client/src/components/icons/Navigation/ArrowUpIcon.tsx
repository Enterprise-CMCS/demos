import React from "react";

import { IconInput } from "../Icon";
export const ArrowUpIcon = ({
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
      d="M7.5 0C7.64813 0 7.78946 0.0699727 7.88955 0.19287L12.3611 5.68307C12.5583 5.92521 12.5438 6.30144 12.3286 6.52341C12.1135 6.74537 11.7792 6.72901 11.582 6.48687L8.02845 2.12381V13.4052C8.02845 13.7337 7.79186 14 7.5 14C7.20814 14 6.97155 13.7337 6.97155 13.4052V2.12381L3.41801 6.48687C3.2208 6.72901 2.88651 6.74537 2.67137 6.52341C2.45622 6.30144 2.44169 5.92521 2.63891 5.68307L7.11045 0.19287C7.21054 0.0699727 7.35187 0 7.5 0Z"
      fill="currentColor"
    />
  </svg>
);
