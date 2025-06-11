import React from "react";

import { IconInput } from "../Icon";
export const ResolveIcon = ({
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
      d="M14.0453 0.113844C14.3566 0.321372 14.4407 0.741959 14.2332 1.05325L5.80309 13.6983C5.67745 13.8868 5.46594 14 5.23944 14C5.01295 14 4.80144 13.8868 4.6758 13.6983L0.460768 7.3758C0.25324 7.06451 0.337357 6.64392 0.648649 6.43639C0.959941 6.22886 1.38053 6.31298 1.58806 6.62427L5.23944 12.1014L13.1059 0.301725C13.3134 -0.00956688 13.734 -0.0936842 14.0453 0.113844Z"
      fill="currentColor"
    />
  </svg>
);
