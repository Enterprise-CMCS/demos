import React from "react";

import { IconInput } from "../Icon";
export const ChevronLeftIcon: React.FC<IconInput> = ({
  label = "Chevron Left",
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
      d="M10.6851 2.81295C11.0564 2.40046 11.1065 1.6648 10.7972 1.16981C10.4878 0.674825 9.93606 0.607947 9.56482 1.02044L4.31484 6.85374C3.89505 7.32017 3.89505 8.17983 4.31484 8.64625L9.56482 14.4796C9.93606 14.8921 10.4878 14.8252 10.7972 14.3302C11.1065 13.8352 11.0564 13.0995 10.6851 12.6871L6.24179 7.75L10.6851 2.81295Z"
      fill="currentColor"
    />
  </svg>
);
