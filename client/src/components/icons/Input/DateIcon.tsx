import React from "react";

import { IconInput } from "../Icon";
export const DateIcon: React.FC<IconInput> = ({
  label = "Date",
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
      d="M2.25 1.75H12.75C13.7165 1.75 14.5 2.5335 14.5 3.5V12.25C14.5 13.2165 13.7165 14 12.75 14H2.25C1.2835 14 0.5 13.2165 0.5 12.25V3.5C0.5 2.5335 1.2835 1.75 2.25 1.75ZM2.25 2.625C1.76675 2.625 1.375 3.01675 1.375 3.5V12.25C1.375 12.7332 1.76675 13.125 2.25 13.125H12.75C13.2332 13.125 13.625 12.7332 13.625 12.25V3.5C13.625 3.01675 13.2332 2.625 12.75 2.625H2.25Z"
      fill="currentColor"
    />
    <path d="M2.25 0H3.125V1.75H2.25V0Z" fill="currentColor" />
    <path d="M11 9.625H12.75V11.375H11V9.625Z" fill="currentColor" />
    <path d="M11.875 0H12.75V1.75H11.875V0Z" fill="currentColor" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.8125 5.25C1.8125 5.00838 2.00838 4.8125 2.25 4.8125H12.75C12.9916 4.8125 13.1875 5.00838 13.1875 5.25C13.1875 5.49162 12.9916 5.6875 12.75 5.6875H2.25C2.00838 5.6875 1.8125 5.49162 1.8125 5.25Z"
      fill="currentColor"
    />
  </svg>
);
