import React from "react";

import { IconInput } from "../Icon";
export const ResizeIcon: React.FC<IconInput> = ({
  label = "Resize Icon",
  width = "17",
  height = "24",
  viewBox = "0 0 17 24",
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
      d="M16.3536 16.1464C16.5488 16.3417 16.5488 16.6583 16.3536 16.8536L9.35355 23.8536C9.15829 24.0488 8.84171 24.0488 8.64645 23.8536C8.45118 23.6583 8.45118 23.3417 8.64645 23.1464L15.6464 16.1464C15.8417 15.9512 16.1583 15.9512 16.3536 16.1464Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.3536 19.1464C16.5488 19.3417 16.5488 19.6583 16.3536 19.8536L12.3536 23.8536C12.1583 24.0488 11.8417 24.0488 11.6464 23.8536C11.4512 23.6583 11.4512 23.3417 11.6464 23.1464L15.6464 19.1464C15.8417 18.9512 16.1583 18.9512 16.3536 19.1464Z"
      fill="currentColor"
    />
  </svg>
);
