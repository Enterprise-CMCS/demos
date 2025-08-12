import React from "react";

import { IconInput } from "../Icon";
export const ArrowDownIcon: React.FC<IconInput> = ({
  label = "Arrow Down",
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
    aria-label={label}
    role="img"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 14C7.35187 14 7.21054 13.93 7.11045 13.8071L2.63891 8.31693C2.44169 8.07479 2.45622 7.69856 2.67137 7.47659C2.88651 7.25463 3.2208 7.27099 3.41801 7.51313L6.97155 11.8762L6.97155 0.59477C6.97155 0.266287 7.20814 -4.62629e-07 7.5 -4.37114e-07C7.79186 -4.11599e-07 8.02846 0.266287 8.02846 0.59477L8.02845 11.8762L11.582 7.51313C11.7792 7.27099 12.1135 7.25463 12.3286 7.47659C12.5438 7.69856 12.5583 8.07479 12.3611 8.31693L7.88955 13.8071C7.78946 13.93 7.64813 14 7.5 14Z"
      fill="currentColor"
    />
  </svg>
);
