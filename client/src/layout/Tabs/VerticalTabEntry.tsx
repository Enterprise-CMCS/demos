import React, { ReactNode } from "react";
import { tw } from "tags/tw";

const BASE_TAB_STYLES = tw`flex items-center gap-1 font-medium px-1 cursor-pointer text-left w-full h-[40px] text-gray-600 hover:text-gray-800`;

const SELECTED_TAB_STYLES = tw`border-l-4 border-l-focus border-t border-t-gray-dark border-b border-b-gray-dark bg-white font-semibold `;

const TabEntryIcon: React.FC<{ icon: React.ReactNode; isSelected: boolean }> = ({
  icon,
  isSelected,
}) => {
  return (
    <span className={`${isSelected ? "text-focus" : ""}`} aria-hidden="true">
      {icon}
    </span>
  );
};

interface TabEntryProps {
  value: string;
  isSelected: boolean;
  label: ReactNode;
  isNavCollapsed: boolean;
  handleTabSelect: (value: string) => void;
  icon: React.ReactNode;
}

export const VerticalTabEntry = ({
  value,
  isSelected,
  label,
  isNavCollapsed,
  handleTabSelect,
  icon,
}: TabEntryProps) => {
  const getStyles = () => {
    if (isSelected) {
      return `${BASE_TAB_STYLES} ${SELECTED_TAB_STYLES}`;
    }
    return BASE_TAB_STYLES;
  };

  return (
    <button
      key={value}
      data-testid={`button-${value}`}
      onClick={() => handleTabSelect(value)}
      className={getStyles()}
      aria-selected={isSelected}
      title={label?.toString() || value}
    >
      {icon && <TabEntryIcon icon={icon} isSelected={isSelected} />}
      {!isNavCollapsed && label}
    </button>
  );
};
