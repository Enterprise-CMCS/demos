import React from "react";

import { IconInput } from "../Icon";
export const InfoIcon: React.FC<IconInput> = ({
  label = "Info",
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
    <path
      d="M0.5 3.63636L10.5 0L20.5 3.63636V9.09091C20.5 14.1364 16.2333 18.8545 10.5 20C4.76667 18.8545 0.5 14.1364 0.5 9.09091V3.63636Z"
      fill="#205493"
    />
    <path
      d="M11.3334 13.712L11.3334 9.92415C11.3334 9.46392 10.9603 9.09082 10.5001 9.09082C10.0398 9.09082 9.66675 9.46392 9.66675 9.92415L9.66675 13.712C9.66675 14.1723 10.0398 14.5454 10.5001 14.5454C10.9603 14.5454 11.3334 14.1723 11.3334 13.712Z"
      fill="white"
    />
    <path
      d="M11.6111 7.27262C11.6111 6.77054 11.1137 6.36353 10.5 6.36353C9.88638 6.36353 9.38892 6.77054 9.38892 7.27262C9.38892 7.77469 9.88638 8.18171 10.5 8.18171C11.1137 8.18171 11.6111 7.77469 11.6111 7.27262Z"
      fill="white"
    />
  </svg>
);
