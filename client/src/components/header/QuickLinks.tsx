import { BellIcon } from "components/icons/BellIcon";
import { GearIcon } from "components/icons/GearIcon";
import { LifeRaftIcon } from "components/icons/LifeRaftIcon";
import React from "react";

const QuickLinks: React.FC = () => {
  return (
    <ul className="flex items-center gap-3">
      <li>
        <a href="#" className="flex items-center gap-1">
          <GearIcon className="text-[var(--color-action)]"/>
          <span>Admin</span>
        </a>
      </li>
      <li>
        <a href="#" className="flex items-center gap-1">
          <BellIcon className="text-[var(--color-action)]"/>
          <span>Notifications</span>
        </a>
      </li>
      <li>
        <a href="#" className="flex items-center gap-1">
          <LifeRaftIcon className="text-[var(--color-action)]"/>
          <span>Help</span>
        </a>
      </li>
    </ul>
  );
};

export default QuickLinks;
