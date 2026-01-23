import React from "react";
import { IconInput } from "../Icon";

type Props = IconInput & {
  thickness?: number; // in viewBox units
};

export const MinimizeIcon: React.FC<Props> = ({
  label = "Minimize",
  width = "15",
  height = "15",
  viewBox = "0 0 15 15",
  className = "",
  // This is thinkness by default apparantly...
  thickness = 1.3,
}: Props = {}) => {
  const y = (15 - thickness) / 2;
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={label}
      role="img"
    >
      <rect x="2.25" y={y} width="10.5" height={thickness} fill="currentColor" />
    </svg>
  );
};
