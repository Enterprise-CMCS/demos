import React from "react";

import { IconInput } from "../Icon";
export const ArchiveIcon: React.FC<IconInput> = ({
  label = "Archive",
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
      d="M13.4985 14H1.49854V5H1.99854H2.49854V9V13H12.4985V5H13.4985V14ZM0.498535 0H14.4985V4H0.498535V0ZM1.49854 1V3H7.49854H13.4985V1M6.99854 6V9H5.49854L7.49854 12L9.49854 9H7.99854V6"
      fill="currentColor"
    />
  </svg>
);
