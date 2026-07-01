import React from "react";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";
import { Logo } from "components/brand/Logo";

const HEADER_STYLES = "w-full";
const HEADER_UPPER_STYLES = "w-full flex justify-between p-[4px] h-[72px]";
const HEADER_LOWER_STYLES =
  "w-full bg-brand text-white px-[24px] py-[16px] flex items-center justify-between";

const HeaderUpper: React.FC = () => {
  return (
    <div className={HEADER_UPPER_STYLES}>
      <Logo />
      <div className="flex items-center gap-4">
        <QuickLinks />
        <ProfileBlock />
      </div>
    </div>
  );
};

export const Header: React.FC<{ headerLower: React.ReactNode }> = ({ headerLower }) => {
  return (
    <header className={HEADER_STYLES}>
      <HeaderUpper />
      <div className={HEADER_LOWER_STYLES}>{headerLower}</div>
    </header>
  );
};
