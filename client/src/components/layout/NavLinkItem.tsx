// Reusable individual nav item
import React from "react";

import {
  Link,
  useLocation
} from "react-router-dom";

interface NavLinkItemProps {
  link: { label: string; href: string; icon?: React.ReactNode };
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ link }) => {
  const location = useLocation();
  const isActive = location.pathname === link.href;

  return (
    <Link to={link.href}>
      <div className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""}`}>
        {link.icon && <span className="mr-3">{link.icon}</span>}
        <span>{link.label}</span>
      </div>
    </Link>
  );
};

export default NavLinkItem;
