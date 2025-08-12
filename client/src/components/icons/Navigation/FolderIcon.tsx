import React from "react";

import { IconInput } from "../Icon";
export const FolderIcon: React.FC<IconInput> = ({
  label = "Folder",
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
      d="M0.507 1.75L0.5 12.25C0.5 13.2125 1.13 14 1.9 14H13.1C13.87 14 14.5 13.2125 14.5 12.25V3.5C14.5 2.5375 13.87 1.75 13.1 1.75H7.5L6.1 0H1.9C1.13 0 0.507 0.7875 0.507 1.75ZM5.68579 1.25H1.9C1.6888 1.25 1.507 1.46969 1.507 1.75L1.5 12.25C1.5 12.2499 1.5 12.2501 1.5 12.25C1.50016 12.522 1.68238 12.75 1.9 12.75H13.1C13.3177 12.75 13.5 12.5221 13.5 12.25V3.5C13.5 3.22786 13.3177 3 13.1 3H7.08579L5.68579 1.25Z"
      fill="currentColor"
    />
  </svg>
);
