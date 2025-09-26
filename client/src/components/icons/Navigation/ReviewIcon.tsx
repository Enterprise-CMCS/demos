import React from "react";

import { IconInput } from "../Icon";
export const ReviewIcon: React.FC<IconInput> = ({
  label = "Review",
  width = "14",
  height = "14",
  viewBox = "0 0 14 14",
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
      d="M10.0995 6.125L7.66169 3.0625L8.63682 1.8375L10.0995 3.675L13.0249 0L14 1.225L10.0995 6.125ZM6.26866 2.625H0V4.375H6.26866V2.625ZM13.2338 8.225L12.2587 7L10.4478 9.275L8.63682 7L7.66169 8.225L9.47264 10.5L7.66169 12.775L8.63682 14L10.4478 11.725L12.2587 14L13.2338 12.775L11.4229 10.5L13.2338 8.225ZM6.26866 9.625H0V11.375H6.26866V9.625Z"
      fill="currentColor"
    />
  </svg>
);
