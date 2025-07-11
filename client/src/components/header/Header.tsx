import React from "react";
import { HeaderUpper } from "./HeaderUpper";
import { useHeaderConfig } from "./HeaderConfigContext";

export const Header: React.FC<{
  userId?: string;
}> = ({ userId }) => {
  const { effectiveContent } = useHeaderConfig();

  return (
    <div id="header-container" className="top-0 left-0 w-full z-11">
      <HeaderUpper userId={userId} />
      {effectiveContent && (
        <div className="flex w-full min-h-[6rem]">
          {effectiveContent}
        </div>
      )}
    </div>
  );
};
