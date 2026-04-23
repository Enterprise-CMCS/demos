import { HelpIcon, NotifyIcon, SettingsIcon } from "components/icons";
import React from "react";
import { Link, useLocation } from "react-router-dom";

export const ADMIN_LINK_NAME = "link-admin";

const STYLES = {
  container: "flex items-center gap-3",
  link: "flex items-center gap-1",
  icon: "text-action",
  selectedLink: "p-0-5 border-b-4 border-border-focus",
};

export const QuickLinks: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className={STYLES.container}>
      <Link
        to="/admin"
        className={`${STYLES.link} ${pathname === "/admin" ? STYLES.selectedLink : ""}`}
        data-testid={ADMIN_LINK_NAME}
      >
        <SettingsIcon className={STYLES.icon} />
        <span>Admin</span>
      </Link>

      <a href="#" className={STYLES.link}>
        <NotifyIcon className={STYLES.icon} />
        <span>Notifications</span>
      </a>

      <a href="#" className={STYLES.link}>
        <HelpIcon className={STYLES.icon} />
        <span>Help</span>
      </a>
    </div>
  );
};
