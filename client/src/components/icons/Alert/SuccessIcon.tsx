import React from "react";

import { IconInput } from "../Icon";
export const SuccessIcon: React.FC<IconInput> = ({
  label = "Success",
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
    aria-label={label}
    role="img"
  >
    <circle cx="10.5" cy="10" r="10" fill="#2E8540" />
    <path
      d="M8.74279 12.6104L6.11319 9.98084C5.88595 9.75361 5.51773 9.75296 5.28969 9.97939L5.08215 10.1855C4.85297 10.413 4.85231 10.7835 5.08069 11.0119L8.74279 14.674L15.3527 7.99113C15.5784 7.76296 15.5774 7.39536 15.3505 7.16844L15.1475 6.96542C14.9187 6.73668 14.5475 6.73776 14.3201 6.96783L8.74279 12.6104Z"
      fill="#2E8540"
    />
    <mask
      id="mask0_10164_280144"
      style={{ maskType: "luminance" }}
      maskUnits="userSpaceOnUse"
      x="4"
      y="6"
      width="12"
      height="9"
    >
      <path
        d="M8.74279 12.6104L6.11319 9.98084C5.88595 9.75361 5.51773 9.75296 5.28969 9.97939L5.08215 10.1855C4.85297 10.413 4.85231 10.7835 5.08069 11.0119L8.74279 14.674L15.3527 7.99113C15.5784 7.76296 15.5774 7.39536 15.3505 7.16844L15.1475 6.96542C14.9187 6.73668 14.5475 6.73776 14.3201 6.96783L8.74279 12.6104Z"
        fill="white"
      />
    </mask>
    <g mask="url(#mask0_10164_280144)">
      <rect x="1.75" y="1.25" width="17.5" height="17.5" fill="white" />
    </g>
  </svg>
);
