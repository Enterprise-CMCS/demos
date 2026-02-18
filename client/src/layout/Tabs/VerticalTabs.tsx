import React, { ReactElement, useState } from "react";

import { MenuCollapseLeftIcon, MenuCollapseRightIcon } from "components/icons";
import { TabProps } from "./Tabs";
import { VerticalTabEntry } from "./VerticalTabEntry";
import { tw } from "tags/tw";

const SelectedTabPanel = ({ children }: { children: React.ReactNode }) => {
  const styles = tw`bg-white overflow-y-auto p-[16px] border-r-gray-dark border-r-1 border-t-1 border-t-gray-dark border-b-1 border-b-gray-dark flex-1`;
  return <div className={styles}>{children}</div>;
};

interface CollapseNavButtonProps {
  isNavCollapsed: boolean;
  onClick: () => void;
}

const CollapseNavButton: React.FC<CollapseNavButtonProps> = ({ isNavCollapsed, onClick }) => (
  <div className={tw`flex items-center justify-end`}>
    <button
      onClick={onClick}
      className={tw`hover:bg-gray-100 cursor-pointer`}
      aria-label={isNavCollapsed ? "Expand tabs" : "Collapse tabs"}
    >
      <span className={tw`flex items-center justify-center w-4 h-4 shrink-0`}>
        {isNavCollapsed ? <MenuCollapseRightIcon /> : <MenuCollapseLeftIcon />}
      </span>
    </button>
  </div>
);

interface VerticalTabsProps {
  children: ReactElement<TabProps>[] | ReactElement<TabProps>;
  defaultValue: string;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({ children, defaultValue }) => {
  const allTabs = children instanceof Array ? children : [children];
  const visibleTabs = allTabs.filter((tab) => tab.props.shouldRender !== false);

  const defaultTab = visibleTabs.find((tab) => tab.props.value === defaultValue)
    ? defaultValue
    : visibleTabs[0]?.props.value || "";

  const [selectedValue, setSelectedValue] = useState<string>(defaultTab);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const selectedTab = visibleTabs.find((tab) => tab.props.value === selectedValue);

  const handleTabSelect = (value: string) => {
    setSelectedValue(value);
  };

  const navWidth = isNavCollapsed ? "w-12" : "w-42.5";

  return (
    <div className={tw`flex flex-row`}>
      <div
        className={`flex flex-col bg-gray-primary-layout border-r border-r-gray-dark ${navWidth}`}
      >
        <CollapseNavButton
          isNavCollapsed={isNavCollapsed}
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        />

        {visibleTabs.map((tab) => {
          const { label, value, icon } = tab.props;
          const isSelected = value === selectedValue;

          return (
            <VerticalTabEntry
              key={value}
              value={value}
              label={label}
              icon={icon}
              isSelected={isSelected}
              isNavCollapsed={isNavCollapsed}
              handleTabSelect={handleTabSelect}
            />
          );
        })}
      </div>

      <SelectedTabPanel>{selectedTab?.props.children}</SelectedTabPanel>
    </div>
  );
};
