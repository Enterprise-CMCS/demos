import React from "react";

import { IconInput } from "../Icon";
export const Medication = ({
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
      d="M13.1 0H1.9C1.5287 0 1.1726 0.105357 0.91005 0.292893C0.6475 0.48043 0.5 0.734784 0.5 1V3C0.5 3.26522 0.6475 3.51957 0.91005 3.70711C1.1726 3.89464 1.5287 4 1.9 4V13C1.9 13.2652 2.0475 13.5196 2.31005 13.7071C2.5726 13.8946 2.9287 14 3.3 14H11.7C12.0713 14 12.4274 13.8946 12.6899 13.7071C12.9525 13.5196 13.1 13.2652 13.1 13V4C13.4713 4 13.8274 3.89464 14.0899 3.70711C14.3525 3.51957 14.5 3.26522 14.5 3V1C14.5 0.734784 14.3525 0.48043 14.0899 0.292893C13.8274 0.105357 13.4713 0 13.1 0ZM3.3 6H5.4V11H3.3V6ZM11.7 13H3.3V12H6.8V5H3.3V4H11.7V13ZM1.9 3V1H13.1V3H1.9Z"
      fill="currentColor"
    />
  </svg>
);
