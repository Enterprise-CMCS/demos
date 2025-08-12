import React from "react";

import { IconInput } from "../Icon";
export const FileIcon: React.FC<IconInput> = ({
  label = "File Icon",
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
      d="M1.77126 1V13L13.2258 13L13.2258 3.26297L9.83135 1H1.77126ZM0.498535 13V1C0.498535 0.447716 1.06835 0 1.77126 0H9.83135C10.133 0 10.4248 0.0841655 10.6548 0.237491L14.0492 2.50047C14.3342 2.69047 14.4985 2.9693 14.4985 3.26297V13C14.4985 13.5523 13.9287 14 13.2258 14H1.77126C1.06835 14 0.498535 13.5523 0.498535 13Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.04399 7.5C3.04399 7.22386 3.2882 7 3.58944 7H10.1349C10.4361 7 10.6804 7.22386 10.6804 7.5C10.6804 7.77614 10.4361 8 10.1349 8H3.58944C3.2882 8 3.04399 7.77614 3.04399 7.5Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.04399 4.5C3.04399 4.22386 3.27192 4 3.55308 4H7.62581C7.90697 4 8.1349 4.22386 8.1349 4.5C8.1349 4.77614 7.90697 5 7.62581 5H3.55308C3.27192 5 3.04399 4.77614 3.04399 4.5Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.04399 10.5C3.04399 10.2239 3.2882 10 3.58944 10H10.1349C10.4361 10 10.6804 10.2239 10.6804 10.5C10.6804 10.7761 10.4361 11 10.1349 11H3.58944C3.2882 11 3.04399 10.7761 3.04399 10.5Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.40763 3V0.5H10.6804V3H13.8622V4H10.6804C9.97745 4 9.40763 3.55228 9.40763 3Z"
      fill="currentColor"
    />
  </svg>
);
