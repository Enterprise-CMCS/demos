import React from "react";

import { IconInput } from "../Icon";

export const MenuCollapseLeftIcon: React.FC<IconInput> = ({
  label = "Menu Collapse Left Icon",
  width = "20",
  height = "20",
  viewBox = "0 1 12 12",
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
      d="M1.5 4.37112e-08L1.5 14H0.5L0.500001 0L1.5 4.37112e-08Z"
      fill="currentColor"
    />
    <path
      d="M14.5 7.00016C14.5 7.28832 14.2843 7.52191 14.0181 7.52191L5.15048 7.52191L7.54029 10.1096C7.72846 10.3133 7.72846 10.6437 7.54029 10.8474C7.35211 11.0512 7.04701 11.0512 6.85884 10.8474L3.64645 7.36909C3.40301 7.00016 3.50596 6.78335 3.64677 6.63088L6.85884 3.1529C7.04701 2.94914 7.35211 2.94914 7.54029 3.1529C7.72846 3.35665 7.72846 3.68701 7.54029 3.89076L5.15048 6.47841L14.0181 6.47841C14.2843 6.47841 14.5 6.71201 14.5 7.00016Z"
      fill="currentColor"
    />
  </svg>
);
