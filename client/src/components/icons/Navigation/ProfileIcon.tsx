import React from "react";

import { IconInput } from "../Icon";
export const ProfileIcon: React.FC<IconInput> = ({
  label = "Profile",
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
    aria-label={label}
    role="img"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.50095 0C10.6829 -5.54005e-06 11.8532 0.232782 12.9451 0.68507C14.037 1.13736 15.0292 1.80029 15.8649 2.63602C16.7007 3.47174 17.3636 4.4639 17.8159 5.55583C18.2682 6.64776 18.501 7.81808 18.501 8.99998C18.501 13.9705 14.4715 18 9.50095 18C4.53043 18 0.500977 13.9705 0.500977 8.99998C0.500977 4.02945 4.53043 0 9.50095 0Z"
      fill="currentColor"
    />
    <path
      d="M8.60086 9.8999H10.4009C12.629 9.8999 14.5419 11.2494 15.367 13.1755C14.0615 15.0062 11.9206 16.1999 9.50085 16.1999C7.08114 16.1999 4.94021 15.0062 3.63477 13.1757C4.45983 11.2494 6.37273 9.8999 8.60086 9.8999Z"
      fill="white"
    />
    <path
      d="M6.80103 5.39995C6.80103 3.90879 8.00986 2.69995 9.50102 2.69995C10.9922 2.69995 12.201 3.90879 12.201 5.39995C12.201 6.89111 10.9922 8.09995 9.50102 8.09995C8.00986 8.09995 6.80103 6.89111 6.80103 5.39995Z"
      fill="white"
    />
  </svg>
);
