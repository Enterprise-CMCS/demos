import React from "react";
import { HeaderLower } from "./HeaderLower";
import { HeaderUpper } from "./HeaderUpper";

export const Header: React.FC<{
  userId?: number;
}> = ({ userId }) => {
  return (
    <div id="header-container" className="top-0 left-0 w-full z-11">
      <HeaderUpper userId={userId} />
      {/* HeaderLower is now rendered by HeaderConfigProvider */}
    </div>
  );
};
