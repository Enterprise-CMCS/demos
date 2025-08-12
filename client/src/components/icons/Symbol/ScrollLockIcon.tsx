import React from "react";

import { IconInput } from "../Icon";
export const ScrollLockIcon: React.FC<IconInput> = ({
  label = "Scroll Lock Icon",
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.50049 0L6.50049 4H0.500489L3.50049 0ZM3.50049 1.86647L2.71955 2.90773H4.28143L3.50049 1.86647Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 14L0.5 10H6.5L3.5 14ZM4.28094 11.0923H2.71906L3.5 12.1335L4.28094 11.0923Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.8501 10.5L2.8501 3.5H4.1501L4.1501 10.5H2.8501Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.5 7.57143C7.5 6.70355 8.20837 6 9.08219 6H12.9178C13.7916 6 14.5 6.70355 14.5 7.57143V10.4286C14.5 11.2964 13.7916 12 12.9178 12H9.08219C8.20837 12 7.5 11.2964 7.5 10.4286V7.57143ZM9.08219 7.2381C8.89684 7.2381 8.74658 7.38733 8.74658 7.57143V10.4286C8.74658 10.6127 8.89684 10.7619 9.08219 10.7619H12.9178C13.1032 10.7619 13.2534 10.6127 13.2534 10.4286V7.57143C13.2534 7.38733 13.1032 7.2381 12.9178 7.2381H9.08219Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.1364 3.49215C9.86872 3.73625 9.72642 4.03131 9.72642 4.27957V7H8.5V4.27957C8.5 3.66761 8.82939 3.10246 9.26923 2.7014C9.70906 2.30035 10.3289 2 11 2C11.6711 2 12.2909 2.30035 12.7308 2.7014C13.1706 3.10246 13.5 3.66761 13.5 4.27957V7H12.2736V4.27957C12.2736 4.03131 12.1313 3.73625 11.8636 3.49215C11.5959 3.24804 11.2723 3.11828 11 3.11828C10.7277 3.11828 10.4041 3.24804 10.1364 3.49215Z"
      fill="currentColor"
    />
  </svg>
);
