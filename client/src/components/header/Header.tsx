import React from "react";
import { useLocation, useParams } from "react-router-dom";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";

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
  const headerStyles = "relative top-0 left-0 w-full z-11";

  return (
    <header className={headerStyles}>
      <HeaderUpper />
      <HeaderLower />
    </header>
  );
};
