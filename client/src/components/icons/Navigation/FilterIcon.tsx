import React from "react";

import { IconInput } from "../Icon";
export const FilterIcon: React.FC<IconInput> = ({
  label = "Filter",
  width = "17",
  height = "17",
  viewBox = "0 0 17 17",
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
      d="M0.564741 0.346066C0.66979 0.134099 0.885913 0 1.12248 0H15.8775C16.1141 0 16.3302 0.134099 16.4353 0.346066C16.5403 0.558033 16.5161 0.811226 16.3729 0.999475L10.598 8.58701V15.3775C10.598 15.5981 10.4813 15.8022 10.2912 15.914C10.1011 16.0259 9.86601 16.0288 9.67321 15.9217L6.7222 14.2822C6.52458 14.1724 6.40202 13.9641 6.40202 13.7381V8.58701L0.627151 0.999475C0.483876 0.811226 0.459692 0.558033 0.564741 0.346066ZM2.37851 1.24496L7.51983 8.00008C7.60231 8.10845 7.64698 8.24088 7.64698 8.37707V13.3718L9.35303 14.3196V8.37707C9.35303 8.24088 9.39769 8.10845 9.48018 8.00008L14.6215 1.24496H2.37851Z"
      fill="currentColor"
    />
  </svg>
);
