import React from "react";
import { Link, useLocation } from "react-router-dom";

import { DebugOnly } from "components/debug/DebugOnly";
import {
  ActionsIcon,
  AnalyticsIcon,
  CompareIcon,
  FavoriteIcon,
  FolderIcon,
  ListIcon,
  MenuCollapseLeftIcon,
  MenuCollapseRightIcon,
  ScaleIcon
} from "components/icons";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactElement;
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
];

interface NavLinkProps {
  collapsed: boolean;
  navLinks: NavLink[];
}

const NavLinks = (props: NavLinkProps) => {
  const location = useLocation();

  return (
    <ul className="flex flex-col gap-[4px] mt-[8px]">
      {props.navLinks.map((link) => {
        const isActive = location.pathname === link.href;
        return (
          <li key={link.href}>
            <Link to={link.href} title={props.collapsed ? link.label : ""}>
              <div
                className={`
                    relative flex items-center h-10 transition-all duration-150 ease-in-out
                    text-black
                    ${ props.collapsed ? "justify-center w-20" : "justify-start w-64 px-4 gap-2" }
                    hover:bg-[var(--color-surface-secondary)]
                    ${isActive ? "font-semibold" : "font-normal"}
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
                {!props.collapsed && (
                  <span
                    className={`${
                      isActive ? "font-semibold text-black" : "text-black"
                    }`}
                  >
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

interface SideNavProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const SideNav: React.FC<SideNavProps> = ({
  collapsed,
  setCollapsed,
}) => {
  return (
    <nav
      className={`h-full bg-white transition-all duration-300 flex flex-col z-10 ${
        collapsed ? "w-20" : "w-64"
      } shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]`}
    >
      {/* Collapse Toggle */}
      <div className="relative h-12 mt-2">
        {!collapsed ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setCollapsed(true)}
              className="text-[var(--color-text-active)] hover:opacity-80"
              aria-label="Collapse Menu"
            >
              <div className="w-4 h-4">
                <MenuCollapseLeftIcon />
              </div>
            </button>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center relative">
            <button
              onClick={() => setCollapsed(false)}
              className="text-black hover:opacity-80"
              aria-label="Expand Menu"
            >
              <div className="w-[14px] h-[14px]">
                <MenuCollapseRightIcon />
              </div>
            </button>
          </div>
        )}
      </div>

      <NavLinks collapsed={collapsed} navLinks={navLinks} />
      <DebugOnly>
        <hr className="my-2 border-t border-gray-200" />
        <NavLinks collapsed={collapsed} navLinks={debugNavLinks} />
      </DebugOnly>
    </nav>
  );
};
