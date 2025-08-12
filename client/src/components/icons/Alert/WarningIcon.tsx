import React from "react";

import { IconInput } from "../Icon";
export const WarningIcon: React.FC<IconInput> = ({
  label = "Warning Icon",
  width = "21",
  height = "21",
  viewBox = "0 0 21 21",
  className = "",
}: IconInput = {}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M10.5 0L20.5 20H0.5L10.5 0Z" fill="#FFC737" />
    <path
      d="M9.75 8.75L9.75 13.25C9.75 13.6642 10.0858 14 10.5 14C10.9142 14 11.25 13.6642 11.25 13.25L11.25 8.75C11.25 8.33579 10.9142 8 10.5 8C10.0858 8 9.75 8.33579 9.75 8.75Z"
      fill="#242424"
    />
    <path
      d="M9.5 16C9.5 16.5523 9.94772 17 10.5 17C11.0523 17 11.5 16.5523 11.5 16C11.5 15.4477 11.0523 15 10.5 15C9.94772 15 9.5 15.4477 9.5 16Z"
      fill="#242424"
    />
  </svg>
);
