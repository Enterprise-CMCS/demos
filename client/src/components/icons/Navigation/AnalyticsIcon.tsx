import React from "react";

import { IconInput } from "../Icon";
export const AnalyticsIcon: React.FC<IconInput> = ({
  label = "Analytics",
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
      d="M1.07143 16H16.5V14.8571H1.64286V0H0.5V15.4286L1.07143 16ZM2.78571 13.1429V4L3.35714 3.42857H5.64286L6.21429 4V13.1429L5.64286 13.7143H3.35714L2.78571 13.1429ZM5.07143 12.5714V4.57143H3.92857V12.5714H5.07143ZM11.9286 1.71429V13.1429L12.5 13.7143H14.7857L15.3571 13.1429V1.71429L14.7857 1.14286H12.5L11.9286 1.71429ZM14.2143 2.28571V12.5714H13.0714V2.28571H14.2143ZM7.35714 13.1429V6.28571L7.92857 5.71429H10.2143L10.7857 6.28571V13.1429L10.2143 13.7143H7.92857L7.35714 13.1429ZM9.64286 12.5714V6.85714H8.5V12.5714H9.64286Z"
      fill="currentColor"
    />
  </svg>
);
