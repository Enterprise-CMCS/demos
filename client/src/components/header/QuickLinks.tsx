import { HelpIcon, NotifyIcon, SettingsIcon } from "components/icons";
import React from "react";

export const QuickLinks: React.FC = () => {
  const iconStyles = "text-action";
  const linkStyles = "flex items-center gap-1";

  return (
    <div className="flex items-center gap-3">
      <a href="#" className={linkStyles}>
        <SettingsIcon className={iconStyles} />
        <span>Admin</span>
      </a>

      <a href="#" className={linkStyles}>
        <NotifyIcon className={iconStyles} />
        <span>Notifications</span>
      </a>

      <a href="#" className={linkStyles}>
        <HelpIcon className={iconStyles} />
        <span>Help</span>
      </a>
    </div>
  );
};
