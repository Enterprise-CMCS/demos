import React from "react";

import {
  ActionsIcon,
  BudgetIcon,
  DashboardsIcon,
  DemonstrationsIcon,
  FolderIcon,
  ListIcon,
  MenuCollapseIcon,
  MenuIcon,
} from "components/icons";
import {
  Link,
  useLocation,
} from "react-router-dom";

const navLinks = [
  { label: "Demonstrations", href: "/demonstrations", icon: <DemonstrationsIcon /> },
  { label: "Actions", href: "/actions", icon: <ActionsIcon /> },
  { label: "Tasks", href: "/tasks", icon: <ListIcon /> },
  { label: "Dashboards", href: "/components", icon: <DashboardsIcon /> },
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
      className={`h-screen bg-white fixed top-0 left-0 transition-all duration-300 flex flex-col z-20 ${collapsed ? "w-20" : "w-64"
        } shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]`}
    >
      {/* Toggle Button */}
      <div className="relative h-12 mt-2">
        {/* Expanded view toggle */}
        {!collapsed && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setCollapsed(true)}
              className="text-black hover:opacity-80"
              aria-label="Collapse Menu"
            >
              <MenuCollapseIcon />
            </button>
          </div>
        )}

        {/* Collapsed view toggle */}
        {collapsed && (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => setCollapsed(false)}
              className="text-black hover:opacity-80"
              aria-label="Expand Menu"
            >
              <MenuIcon />
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
                    ${collapsed ? "justify-center w-20" : "justify-start w-64 px-4 gap-2"}
                    hover:bg-[var(--color-surface-secondary)]
                    ${isActive ? "text-black font-semibold" : "text-black font-normal"}`}
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
                    <span className="text-sm leading-none">{link.label}</span>
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
