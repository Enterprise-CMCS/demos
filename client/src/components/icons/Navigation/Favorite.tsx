import React from "react";

import { IconInput } from "../Icon";
export const Favorite = ({
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
      d="M4.58381 11.6015L7.50144 9.88215L10.4191 11.6241L9.65493 8.36642L12.2252 6.19463L8.84448 5.90053L7.50144 2.82382L6.1584 5.87791L2.77766 6.172L5.34795 8.36642L4.58381 11.6015ZM3.1713 13.5L4.31983 8.69219L0.500977 5.45984L5.53134 5.03453L7.50144 0.5L9.47153 5.03362L14.501 5.45893L10.6821 8.69129L11.8316 13.4991L7.50144 10.9472L3.1713 13.5Z"
      fill="currentColor"
    />
  </svg>
);
