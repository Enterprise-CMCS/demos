import React from "react";

import { IconInput } from "../Icon";
export const PinIcon: React.FC<IconInput> = ({
  label = "Pin Icon",
  width = "19",
  height = "19",
  viewBox = "0 0 19 19",
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
      d="M1.5 17L5.6156 12.8835M5.62005 12.8791L3.14891 10.4079C2.3009 9.56081 3.15424 7.74479 4.31336 7.6719C5.36049 7.60523 7.78451 7.98479 8.59074 7.17856L10.8041 4.9652C11.3526 4.41587 11.0041 3.18741 10.9685 2.51007C10.917 1.60695 12.3535 0.491378 13.1152 1.25316L17.246 5.38476C18.0104 6.14744 16.8904 7.57946 15.9899 7.53145C15.3126 7.4959 14.0832 7.14745 13.5339 7.6959L11.3206 9.90926C10.5152 10.7155 10.8939 13.1386 10.8281 14.1857C10.7552 15.3458 8.93919 16.1991 8.09029 15.3502L5.62005 12.8791Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
