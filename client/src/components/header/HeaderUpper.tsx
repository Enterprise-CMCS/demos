import React from "react";
import Logo from "./Logo";
import QuickLinks from "./QuickLinks";
import ProfileBlock, { profileBlockQueryMocks } from "./ProfileBlock";
import { MockedProvider } from "@apollo/client/testing";

const HeaderUpper: React.FC<{ userId?: number }> = ({ userId }) => {
  return (
    <header className="w-full flex items-stretch justify-between p-1 gap-1">
      <div id="header-upper-left">
        <Logo />
      </div>
      <div id="header-upper-right" className="flex items-center">
        <div id="header-quicklinks" className="border-r-2 border-gray-300 pr-2">
          <QuickLinks />
        </div>
        <MockedProvider mocks={profileBlockQueryMocks} addTypename={false}>
          <ProfileBlock userId={userId} />
        </MockedProvider>
      </div>
    </header>
  );
};

export default HeaderUpper;
