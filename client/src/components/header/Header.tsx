import React from "react";

import { useHeaderConfig } from "./HeaderConfigContext";
import { HeaderUpper } from "./HeaderUpper";

export const Header: React.FC = () => {
  const { effectiveContent } = useHeaderConfig();
  return (
    <div id="header-container" className="top-0 left-0 w-full z-11">
      <HeaderUpper />
      {effectiveContent && <div className="flex w-full min-h-[6rem]">{effectiveContent}</div>}
    </div>
  );
};
