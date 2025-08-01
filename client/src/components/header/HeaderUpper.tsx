import React from "react";

import { Logo } from "./Logo";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";

export const HeaderUpper: React.FC<{ userId?: string }> = ({ userId }) => {
  return (
    <header className="w-full flex items-stretch justify-between py-1 px-2 gap-1">
      <div id="header-upper-left">
        <Logo />
      </div>
      <div id="header-upper-right" className="flex items-center gap-2">
        <div id="header-quicklinks" className="border-r-2 border-gray-300 pr-2">
          <QuickLinks />
        </div>
        <ProfileBlock userId={userId} />
      </div>
    </header>
  );
};
