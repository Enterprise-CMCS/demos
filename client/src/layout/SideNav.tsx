import React from "react";

import {
  ActionIcon,
  BudgetIcon,
  DashboardIcon,
  DemonstrationIcon,
  FolderIcon,
  ListIcon,
  MenuCollapseIcon,
  MenuIcon
} from "components/icons";
import {
  Link,
  useLocation
} from "react-router-dom";

const navLinks = [
  { label: "Demonstrations", href: "/demonstrations", icon: <DemonstrationIcon /> },
  { label: "Actions", href: "/actions", icon: <ActionIcon /> },
  { label: "Tasks", href: "/tasks", icon: <ListIcon /> },
  { label: "Dashboards", href: "/components", icon: <DashboardIcon /> },
  { label: "Reports", href: "/reports", icon: <FolderIcon /> },
  { label: "Budget", href: "/budget", icon: <BudgetIcon /> },
];

const SideNav: React.FC<{ collapsed: boolean; setCollapsed: (val: boolean) => void }> = ({
  collapsed,
  setCollapsed,
}) => {
  const location = useLocation();

  return (
    <nav
      className={`h-full bg-white transition-all duration-300 flex flex-col z-10 ${collapsed ? "w-20" : "w-64"} shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]`}
    >
      {/* Collapse Toggle */}
      <div className="relative h-12 mt-2">
        {/* Expanded view toggle */}
        {!collapsed && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setCollapsed(true)}
              className="text-[var(--color-text-active)] hover:opacity-80"
              aria-label="Collapse Menu"
            >
              <div className="w-4 h-4">
                <MenuCollapseIcon />
              </div>
            </button>
          </div>
        )}

        {/* Collapsed view toggle */}
        {collapsed && (
          <div className="h-12 flex items-center justify-center relative">
            <button
              onClick={() => setCollapsed(false)}
              className="text-black hover:opacity-80"
              aria-label="Expand Menu"
            >
              <div className="w-[14px] h-[14px]">
                <MenuIcon />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <ul className="flex flex-col gap-[4px] mt-[8px]">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;

          return (
            <li key={link.href}>
              <Link to={link.href} title={collapsed ? link.label : ""}>
                <div
                  className={`relative flex items-center h-10 transition-all duration-150 ease-in-out
                  text-black
                  ${collapsed ? "justify-center w-20" : "justify-start w-64 px-4 gap-2"}
                  hover:bg-[var(--color-surface-secondary)]
                  ${isActive ? "font-semibold" : "font-normal"}`}
                >
                  {/* Blue indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-[6px] bg-[var(--color-text-active)] rounded-r-sm" />
                  )}

                  {/* Icon */}
                  <span
                    className={`shrink-0 ${isActive ? "text-[var(--color-text-active)]" : "text-black"
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
    </nav>
  );
};

export default SideNav;
