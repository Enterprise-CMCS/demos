import React from "react";

import { IconInput } from "../Icon";
export const BookIcon: React.FC<IconInput> = ({
  label = "Book",
  width = "24",
  height = "24",
  viewBox = "0 0 24 24",
  className = "lucide lucide-book-open-icon lucide-book-open",
}: IconInput = {}) => (
  <>
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={label}
      role="img"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  </>
);
