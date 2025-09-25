import React from "react";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";
import { useHeaderConfig } from "./HeaderConfigContext";

const Logo: React.FC = () => {
  return (
    <a href="/" className="h-[40px]">
      <img height="40px" src="/img/logo.png" alt="Logo" />
    </a>
  );
};

const HeaderUpper: React.FC = () => {
  const headerStyles = "w-full flex items-stretch justify-between p-[16px] h-[72px]";
  return (
    <div className={headerStyles}>
      <Logo />
      <div className="flex items-center gap-4">
        <QuickLinks />
        <ProfileBlock />
      </div>
    </div>
  );
};

export const Header: React.FC = () => {
  const { effectiveContent } = useHeaderConfig();

  const headerStyles = "relative top-0 left-0 w-full z-11";
  // const headerLowerStyles = "flex w-full min-h-[6rem]";

  return (
    <header className={headerStyles}>
      <HeaderUpper />
      {effectiveContent}
    </header>
  );
};
