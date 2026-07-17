import { BookIcon, SettingsIcon } from "components/icons";
import { getCurrentUser } from "components/user/UserContext";
import React from "react";
import { Link, useLocation } from "react-router-dom";

export const QUICK_LINKS_TEST_ID = "quick-links";
export const ADMIN_LINK_NAME = "link-admin";

const STYLES = {
  container: "flex items-center gap-3",
  link: "flex items-center gap-[4px] font-semibold",
  icon: "text-action h-[16px]",
  selectedLink:
    "p-0-5 border-gray-300 shadow-sm rounded border-1 border-b-4 border-b-action border-border-focus",
};

export const QuickLinks: React.FC = () => {
  const { pathname } = useLocation();
  const { currentUser } = getCurrentUser();
  const isAdmin = currentUser?.person.personType === "demos-admin";

  return (
    <div className={STYLES.container} data-testid={QUICK_LINKS_TEST_ID}>
      {isAdmin && (
        <Link
          to="/admin"
          className={`${STYLES.link} ${pathname === "/admin" ? STYLES.selectedLink : ""}`}
          data-testid={ADMIN_LINK_NAME}
        >
          <SettingsIcon className={STYLES.icon} />
          <span>Admin</span>
        </Link>
      )}
      <Link
        to="/references"
        className={`${STYLES.link} ${pathname === "/references" ? STYLES.selectedLink : ""}`}
        data-testid="link-references"
      >
        <BookIcon className={STYLES.icon} />
        <span className="mt-[-4px]">References</span>
      </Link>
    </div>
  );
};
