import React from "react";

import { IconInput } from "../Icon";
export const VersionIcon: React.FC<IconInput> = ({
  label = "Version Icon",
  width = "13",
  height = "15",
  viewBox = "0 0 13 14",
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
      d="M2.49902 3C3.05131 3 3.49902 2.55228 3.49902 2C3.49902 1.44772 3.05131 1 2.49902 1C1.94674 1 1.49902 1.44772 1.49902 2C1.49902 2.55228 1.94674 3 2.49902 3ZM2.49902 4C3.60359 4 4.49902 3.10457 4.49902 2C4.49902 0.895431 3.60359 0 2.49902 0C1.39445 0 0.499023 0.895431 0.499023 2C0.499023 3.10457 1.39445 4 2.49902 4Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.499 3C11.0513 3 11.499 2.55228 11.499 2C11.499 1.44772 11.0513 1 10.499 1C9.94674 1 9.49902 1.44772 9.49902 2C9.49902 2.55228 9.94674 3 10.499 3ZM10.499 4C11.6036 4 12.499 3.10457 12.499 2C12.499 0.895431 11.6036 0 10.499 0C9.39445 0 8.49902 0.895431 8.49902 2C8.49902 3.10457 9.39445 4 10.499 4Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.49902 13C3.05131 13 3.49902 12.5523 3.49902 12C3.49902 11.4477 3.05131 11 2.49902 11C1.94674 11 1.49902 11.4477 1.49902 12C1.49902 12.5523 1.94674 13 2.49902 13ZM2.49902 14C3.60359 14 4.49902 13.1046 4.49902 12C4.49902 10.8954 3.60359 10 2.49902 10C1.39445 10 0.499023 10.8954 0.499023 12C0.499023 13.1046 1.39445 14 2.49902 14Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.99902 10.5V3.5H2.99902V10.5H1.99902Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.999 3.5V6C10.999 6.24668 10.9291 6.60557 10.7048 6.91715C10.4621 7.25423 10.062 7.5 9.49902 7.5H2.49902V6.5H9.49902C9.73606 6.5 9.83595 6.41243 9.89326 6.33285C9.96891 6.22777 9.99902 6.08666 9.99902 6V3.5H10.999Z"
      fill="currentColor"
    />
  </svg>
);
