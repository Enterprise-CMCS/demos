import { MenuCollapseLeftIcon, MenuCollapseRightIcon } from "components/icons";
import React, { useState, ReactElement, Children } from "react";
import { TabProps, TabsProps } from "./Tabs";

export const VerticalTabs: React.FC<Omit<TabsProps, "styles">> = ({ children, defaultValue }) => {
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultValue || tabs[0]?.props.value || ""
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedTab = tabs.find((tab) => tab.props.value === selectedValue);

  const handleTabSelect = (value: string) => {
    setSelectedValue(value);
  };

  return (
    <div className="flex">
      <div className={`flex flex-col bg-gray-primary-layout ${!isCollapsed ? "w-[180px]" : ""}`}>
        <div className="flex justify-end border-r border-r-gray-dark">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-gray-100"
            aria-label={isCollapsed ? "Expand tabs" : "Collapse tabs"}
          >
            <span className="flex items-center justify-center w-4 h-4 flex-shrink-0">
              {isCollapsed ? <MenuCollapseRightIcon /> : <MenuCollapseLeftIcon />}
            </span>
          </button>
        </div>

        {tabs.map((tab) => {
          const { label, value, icon } = tab.props;
          const isSelected = value === selectedValue;

          return (
            <button
              key={value}
              data-testid={`button-${value}`}
              onClick={() => handleTabSelect(value)}
              className={`flex items-center font-medium cursor-pointer text-left w-full ${
                isSelected
                  ? "border-l-4 border-l-focus border-t border-t-gray-dark border-b border-b-gray-dark bg-white font-semibold"
                  : "text-gray-600 hover:text-gray-800 border-r border-r-gray-dark"
              }`}
              aria-selected={isSelected}
              title={isCollapsed ? String(label) : undefined}
            >
              {icon && (
                <span
                  className={`${isSelected ? "text-focus" : "ml-[4px]"} flex items-center justify-center w-4 h-4`}
                >
                  {icon}
                </span>
              )}
              {!isCollapsed && <span>{label}</span>}
            </button>
          );
        })}
        <div className="flex-1 border-r border-r-gray-dark"></div>
      </div>

      <div className="bg-white overflow-y-auto p-[16px] border-r-gray-dark border-r-1 border-t-1 border-t-gray-dark border-b-1 border-b-gray-dark flex-1">
        {selectedTab?.props.children}
      </div>
    </div>
  );
};
