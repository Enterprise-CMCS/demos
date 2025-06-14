import { HelpIcon, NotifyIcon, SettingsIcon } from "components/icons";
import React from "react";

export const QuickLinks: React.FC = () => {
  return (
    <ul className="flex items-center gap-3">
      <li>
        <a href="#" className="flex items-center gap-1">
          <SettingsIcon className="text-[var(--color-action)]" />
          <span>Admin</span>
        </a>
      </li>
      <li>
        <a href="#" className="flex items-center gap-1">
          <NotifyIcon className="text-[var(--color-action)]" />
          <span>Notifications</span>
        </a>
      </li>
      <li>
        <a href="#" className="flex items-center gap-1">
          <HelpIcon className="text-[var(--color-action)]" />
          <span>Help</span>
        </a>
      </li>
    </ul>
  );
};
