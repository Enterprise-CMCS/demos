import React from "react";

import { IconInput } from "../Icon";
export const ExclusionIcon: React.FC<IconInput> = ({
  label = "Exclusion Icon",
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
      d="M9.49902 1.3C11.5425 1.3 13.199 2.95655 13.199 5C13.199 7.04345 11.5425 8.7 9.49902 8.7C7.45557 8.7 5.79902 7.04345 5.79902 5C5.79902 2.95655 7.45557 1.3 9.49902 1.3ZM9.49902 0C12.2604 0 14.499 2.23858 14.499 5C14.499 7.76142 12.2604 10 9.49902 10C6.7376 10 4.49902 7.76142 4.49902 5C4.49902 2.23858 6.7376 0 9.49902 0Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.49902 5.3C7.54248 5.3 9.19902 6.95655 9.19902 9C9.19902 11.0435 7.54248 12.7 5.49902 12.7C3.45557 12.7 1.79902 11.0435 1.79902 9C1.79902 6.95655 3.45557 5.3 5.49902 5.3ZM5.49902 4C8.26045 4 10.499 6.23858 10.499 9C10.499 11.7614 8.26045 14 5.49902 14C2.7376 14 0.499023 11.7614 0.499023 9C0.499023 6.23858 2.7376 4 5.49902 4Z"
      fill="currentColor"
    />
  </svg>
);
