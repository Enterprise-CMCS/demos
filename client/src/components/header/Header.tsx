import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";

const HEADER_STYLES = "w-full";
const HEADER_UPPER_STYLES = "w-full flex justify-between p-[16px] h-[72px]";
const HEADER_LOWER_STYLES =
  "w-full bg-brand text-white px-[24px] py-[16px] flex items-center justify-between";

const Logo: React.FC = () => {
  return (
    <a href="/" className="h-[40px]">
      <img height="40px" src="/img/logo.png" alt="Logo" />
    </a>
  );
};

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

const HeaderLower: React.FC = () => {
  // Get the current path and params
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const path = location.pathname;

  // Match /demonstrations/:id
  if (path.match(/^\/demonstrations\/[^/]+$/)) {
    const demonstrationId = params.id;
    if (demonstrationId) {
      return <DemonstrationDetailHeader demonstrationId={demonstrationId} />;
    }
  }

  // Default header for all other routes
  return <DefaultHeaderLower />;
};

export const Header: React.FC = () => {
  return (
    <header className={HEADER_STYLES}>
      <HeaderUpper />
      <div className={HEADER_LOWER_STYLES}>
        <HeaderLower />
      </div>
    </header>
  );
};
