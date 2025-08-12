import React from "react";

import { IconInput } from "../Icon";
export const TimeIcon: React.FC<IconInput> = ({
  label = "Time",
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 12.875C10.7447 12.875 13.375 10.2447 13.375 7C13.375 3.75533 10.7447 1.125 7.5 1.125C4.25533 1.125 1.625 3.75533 1.625 7C1.625 10.2447 4.25533 12.875 7.5 12.875ZM7.5 14C11.366 14 14.5 10.866 14.5 7C14.5 3.13401 11.366 0 7.5 0C3.63401 0 0.5 3.13401 0.5 7C0.5 10.866 3.63401 14 7.5 14Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 3C7.77614 3 8 3.22386 8 3.5V7.23241L10.7774 9.08397C11.0071 9.23715 11.0692 9.54759 10.916 9.77735C10.7628 10.0071 10.4524 10.0692 10.2226 9.91603L7 7.76759V3.5C7 3.22386 7.22386 3 7.5 3Z"
      fill="currentColor"
    />
  </svg>
);
