import React from "react";

import { IconInput } from "../Icon";
export const ChevronDownIcon = ({
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
      d="M2.31295 3.81486C1.90046 3.44362 1.1648 3.39346 0.669812 3.70283C0.174825 4.0122 0.107947 4.56394 0.520437 4.93518L6.35375 10.1852C6.82017 10.6049 7.67983 10.6049 8.14625 10.1852L13.9796 4.93518C14.3921 4.56394 14.3252 4.0122 13.8302 3.70283C13.3352 3.39346 12.5995 3.44362 12.1871 3.81486L7.25 8.25821L2.31295 3.81486Z"
      fill="currentColor"
    />
  </svg>
);
