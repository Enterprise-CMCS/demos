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
  { label: "Components", href: "/components", icon: <FolderIcon /> },
  { label: "Authentication", href: "/auth", icon: <ActionsIcon /> },
  { label: "Icons", href: "/icons", icon: <FavoriteIcon /> },
  { label: "Events", href: "/events", icon: <CommentIcon /> },
  { label: "Date Simulation", href: "/dates", icon: <DateIcon /> },
];

const NavLinks = ({ isCollapsed, navLinks }: { isCollapsed: boolean; navLinks: NavLink[] }) => {
  const location = useLocation();

  const BlueIndicatorBar = ({ isActive }: { isActive: boolean }) => {
    const styles = "absolute left-0 top-0 bottom-0 w-[6px] bg-focus rounded-r-sm";
    return <>{isActive && <span className={styles} />}</>;
  };

  const LinkIcon = ({ isActive, icon }: { isActive: boolean; icon: SVGIconElement }) => {
    return (
      <span
        className={`shrink-0 [&>svg]:w-[14px] [&>svg]:h-[14px] ${
          isActive ? "text-text-active" : "text-text-font"
        }`}
      >
        {icon}
      </span>
    );
  };

  const LinkLabel = ({ isActive, labelText }: { isActive: boolean; labelText: string }) => {
    return (
      <>
        {!isCollapsed && (
          <span className={`${isActive ? "font-semibold text-black" : "text-black"}`}>
            {labelText}
          </span>
        )}
      </>
    );
  };

  const SidenavLink = ({
    link,
    isActive,
    isCollapsed,
  }: {
    link: NavLink;
    isActive: boolean;
    isCollapsed: boolean;
  }) => {
    const getActiveStyles = () => (isActive ? "font-semibold bg-surface-selected" : "font-normal");

    const getCollapsedStyles = () =>
      isCollapsed ? "justify-center w-20" : "justify-start w-64 px-1 gap-2";

    const colorStyles = "text-text-font hover:bg-surface-secondary";
    const flexStyles = "px-[16px] relative flex gap-[8px] max-w-full items-center h-10";
    const animationStyles = "transition-all duration-300";
    const baseStyles = `${colorStyles} ${flexStyles} ${animationStyles}`;

    return (
      <div className={`${baseStyles} ${getCollapsedStyles()} ${getActiveStyles()}`}>
        <BlueIndicatorBar isActive={isActive} />
        <LinkIcon isActive={isActive} icon={link.icon} />
        <LinkLabel isActive={isActive} labelText={link.label} />
      </div>
    );
  };

  return (
    <ul className="flex flex-col">
      {navLinks.map((link) => {
        const isActive =
          location.pathname === link.href ||
          (link.href === "/demonstrations" && location.pathname === "/");

        return (
          <li key={link.href}>
            <Link to={link.href} title={link.label}>
              <SidenavLink link={link} isActive={isActive} isCollapsed={isCollapsed}></SidenavLink>
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
  const iconStyles = "w-[14px] h-[14px] cursor-pointer";
  const getCollapsedStyles = () => {
    return isCollapsed ? "flex justify-center text-text-font" : "flex justify-end text-action";
  };
  const containerStyles = `h-[40px] flex items-center shrink-0 p-2 ${getCollapsedStyles()} `;

  const CollapseButton = () => {
    return (
      <button
        data-testid="collapse-sidenav"
        onClick={() => setIsCollapsed(true)}
        className={containerStyles}
        aria-label="Collapse Menu"
      >
        <MenuCollapseLeftIcon className={iconStyles} />
      </button>
    );
  };

  const ExpandButton = () => {
    return (
      <button
        data-testid="expand-sidenav"
        onClick={() => setIsCollapsed(false)}
        className={containerStyles}
        aria-label="Expand Menu"
      >
        <MenuCollapseRightIcon className={iconStyles} />
      </button>
    );
  };

  return <>{isCollapsed ? <ExpandButton /> : <CollapseButton />}</>;
};

export const SideNav = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const sideNavStyles = "h-full bg-white transition-all duration-300 flex flex-col z-10";

  const getNavWidthStyles = () => {
    return isCollapsed ? "w-20" : "w-[180px]";
  };

  const DebugLinks = () => {
    return (
      <DebugOnly>
        <hr className="my-2 border-t border-gray-200" />
        <NavLinks isCollapsed={isCollapsed} navLinks={debugNavLinks} />
      </DebugOnly>
    );
  };

  return (
    <nav className={`${sideNavStyles} ${getNavWidthStyles()}`}>
      <CollapseToggleButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <NavLinks isCollapsed={isCollapsed} navLinks={navLinks} />
      <DebugLinks />
    </nav>
  );
};
