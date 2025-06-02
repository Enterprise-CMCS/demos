import React from "react";
import HeaderLower from "./HeaderLower";
import HeaderUpper from "./HeaderUpper";

const Header: React.FC<{
  userId?: number;
}> = ({ userId }) => {
  return (
    <div id="header-container" className="fixed top-0 left-0 w-full z-11">
      <HeaderUpper userId={userId} />
      <HeaderLower userId={userId}/>
    </div>
  );
};

export default Header;
