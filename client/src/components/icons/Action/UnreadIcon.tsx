import React from "react";

import { IconInput } from "../Icon";
export const UnreadIcon: React.FC<IconInput> = ({
  label = "Unread Icon",
  width = "5",
  height = "4",
  viewBox = "0 0 5 4",
  className = "",
}: IconInput = {}) => (
  <svg
    width={width}
    height={height}
    viewBox={viewBox}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="2.5" cy="2" r="2" fill="currentColor" />
  </svg>
);
