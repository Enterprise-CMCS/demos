import React from "react";

import { IconInput } from "../Icon";
export const ChevronUpIcon = ({
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
      d="M12.6871 10.1851C13.0995 10.5564 13.8352 10.6065 14.3302 10.2972C14.8252 9.9878 14.8921 9.43606 14.4796 9.06482L8.64625 3.81484C8.17983 3.39505 7.32017 3.39505 6.85375 3.81484L1.02044 9.06482C0.607947 9.43606 0.674826 9.98781 1.16981 10.2972C1.6648 10.6065 2.40046 10.5564 2.81295 10.1851L7.75 5.74179L12.6871 10.1851Z"
      fill="currentColor"
    />
  </svg>
);
