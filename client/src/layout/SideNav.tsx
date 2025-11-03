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

const SIDE_NAV_STYLES = "h-full bg-white transition-all duration-300 flex flex-col z-10";

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

  const LinkIcon = ({
    isActive,
    icon,
    size = 16,
  }: {
    isActive: boolean;
    icon: SVGIconElement;
    size?: number;
  }) => {
    const colorStyles = isActive ? "text-text-active" : "text-text-font";
    const sizeStyles = `w-[${size}px] h-[${size}px] my-auto`;
    return (
      <span className={`block ${colorStyles} ${sizeStyles}`}>
        {React.cloneElement(icon, { width: size, height: size })}
      </span>
    );
  };

  const LinkLabel = ({ isActive, labelText }: { isActive: boolean; labelText: string }) => {
    const fontStyles = isActive ? "font-semibold text-black" : "text-black";
    return (
      <>
        {!isCollapsed && <span className={`block leading-tight ${fontStyles}`}>{labelText}</span>}
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

    const getCollapsedStyles = () => (isCollapsed ? "justify-center" : "justify-start px-1 gap-2");

    const colorStyles = "text-text-font hover:bg-surface-secondary";
    const flexStyles = "flex items-center justify-center px-[16px] relative  gap-[8px]  h-10";
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

  const getNavWidthStyles = () => {
    return isCollapsed ? "w-[48px]" : "w-[180px]";
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
    <nav className={`${SIDE_NAV_STYLES} ${getNavWidthStyles()}`}>
      <CollapseToggleButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <NavLinks isCollapsed={isCollapsed} navLinks={navLinks} />
      <DebugLinks />
    </nav>
  );
};
