import React from "react";

import { IconInput } from "../Icon";
export const ChevronRight = ({
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
      d="M4.31486 12.1871C3.94362 12.5995 3.89346 13.3352 4.20283 13.8302C4.5122 14.3252 5.06394 14.3921 5.43518 13.9796L10.6852 8.14625C11.1049 7.67983 11.1049 6.82017 10.6852 6.35375L5.43518 0.520437C5.06394 0.107947 4.5122 0.174826 4.20283 0.669813C3.89346 1.1648 3.94362 1.90046 4.31486 2.31295L8.75821 7.25L4.31486 12.1871Z"
      fill="currentColor"
    />
  </svg>
);
