import React from "react";

import { IconInput } from "../Icon";

export const SparklyIcon: React.FC<IconInput> = ({
  label = "Sparkly",
  width = "16",
  height = "16",
  viewBox = "0 0 16 16",
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
      d="M6.5 1.9 7.8 5.4 11.3 6.7 7.8 8 6.5 11.5 5.2 8 1.7 6.7 5.2 5.4 6.5 1.9Z"
      fill="currentColor"
    />
    <path
      d="M12.2 1.7 12.8 3.3 14.3 3.8 12.8 4.4 12.2 6 11.7 4.4 10.1 3.8 11.7 3.3 12.2 1.7Z"
      fill="currentColor"
    />
    <path
      d="M12 9.3 12.7 11.2 14.6 11.9 12.7 12.6 12 14.5 11.3 12.6 9.4 11.9 11.3 11.2 12 9.3Z"
      fill="currentColor"
    />
  </svg>
);
