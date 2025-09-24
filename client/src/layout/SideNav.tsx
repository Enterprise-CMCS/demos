import React from "react";

import { DebugOnly } from "components/debug/DebugOnly";
import {
  ActionsIcon,
  AnalyticsIcon,
  CommentIcon,
  CompareIcon,
  DateIcon,
  FavoriteIcon,
  FolderIcon,
  ListIcon,
  MenuCollapseLeftIcon,
  MenuCollapseRightIcon,
  ScaleIcon,
} from "components/icons";
import { Link, useLocation } from "react-router-dom";

type SVGIconElement = React.ReactElement<React.SVGProps<SVGSVGElement>>;
interface NavLink {
  label: string;
  href: string;
  icon: SVGIconElement;
}

const navLinks: NavLink[] = [
  { label: "Demonstrations", href: "/demonstrations", icon: <CompareIcon /> },
  { label: "Actions", href: "#1", icon: <ActionsIcon /> },
  { label: "Tasks", href: "#2", icon: <ListIcon /> },
  { label: "Dashboards", href: "#3", icon: <AnalyticsIcon /> },
  { label: "Reports", href: "#4", icon: <FolderIcon /> },
  { label: "Budget", href: "#5", icon: <ScaleIcon /> },
];

const debugNavLinks: NavLink[] = [
  { label: "Hooks", href: "/hooks", icon: <ListIcon /> },
  { label: "Components", href: "/components", icon: <FolderIcon /> },
  { label: "Authentication", href: "/auth", icon: <ActionsIcon /> },
  { label: "Icons", href: "/icons", icon: <FavoriteIcon /> },
  { label: "Events", href: "/events", icon: <CommentIcon /> },
  { label: "Dates", href: "/dates", icon: <DateIcon /> },
];

const STYLES = {
  sideNav: "h-full bg-white transition-all duration-300 flex flex-col z-10",
  toggleIcon: "w-2 h-2",
};

const NavLinks = ({ collapsed, navLinks }: { collapsed: boolean; navLinks: NavLink[] }) => {
  const location = useLocation();

  return (
    <ul className="flex flex-col gap-[4px] mt-[8px]">
      {navLinks.map((link) => {
        const isActive =
          location.pathname === link.href ||
          (link.href === "/demonstrations" && location.pathname === "/");
        return (
          <li key={link.href}>
            <Link to={link.href} title={collapsed ? link.label : ""}>
              <div
                className={`
                    relative flex items-center h-10 transition-all duration-150 ease-in-out
                    text-black
                    ${collapsed ? "justify-center w-20" : "justify-start w-64 px-1 gap-2"}
                    hover:bg-[var(--color-surface-secondary)]
                    ${isActive ? "font-semibold bg-[var(--color-surface-selected)] rounded-md" : "font-normal"}
                  `}
              >
                {/* Blue indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[6px] bg-[var(--color-text-active)] rounded-r-sm" />
                )}

                {/* Icon */}
                <span
                  className={`shrink-0 ${
                    isActive ? "text-[var(--color-text-active)]" : "text-black"
                  }`}
                >
                  {React.cloneElement(link.icon, {
                    className: "w-[14px] h-[14px]",
                  })}
                </span>

                {/* Label */}
                {!collapsed && (
                  <span className={`${isActive ? "font-semibold text-black" : "text-black"}`}>
                    {link.label}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const CollapseToggleButton = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (bool: boolean) => void;
}) => {
  return (
    <div className="relative h-12">
      {!isCollapsed ? (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <button
            data-testid="collapse-sidenav"
            onClick={() => setIsCollapsed(true)}
            className={STYLES.toggleIcon}
            aria-label="Collapse Menu"
          >
            <MenuCollapseLeftIcon className={STYLES.toggleIcon} />
          </button>
        </div>
      ) : (
        <div className="h-12 flex items-center justify-center relative">
          <button
            data-testid="expand-sidenav"
            onClick={() => setIsCollapsed(false)}
            className={STYLES.toggleIcon}
            aria-label="Expand Menu"
          >
            <MenuCollapseRightIcon className={STYLES.toggleIcon} />
          </button>
        </div>
      )}
    </div>
  );
};

export const SideNav = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getNavWidthStyles = () => {
    return isCollapsed ? "w-20" : "w-[180px]";
  };

  return (
    <nav className={`${STYLES.sideNav} ${getNavWidthStyles()}`}>
      <CollapseToggleButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <NavLinks collapsed={isCollapsed} navLinks={navLinks} />
      <DebugOnly>
        <hr className="my-2 border-t border-gray-200" />
        <NavLinks collapsed={isCollapsed} navLinks={debugNavLinks} />
      </DebugOnly>
    </nav>
  );
};
