import React, { Children, ReactElement, useState } from "react";

export interface TabProps {
  label: React.ReactNode;
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

export interface TabsStyles {
  getButtonStyles: (isSelected: boolean) => string;
  contentStyles: string;
}

const defaultStyles: TabsStyles = {
  getButtonStyles: (isSelected: boolean) =>
    `p-1 font-medium cursor-pointer bg-gray-primary-layout ${
      isSelected
        ? "border-t-4 border-t-focus border-r-1 border-r-gray-dark border-l-1 border-l-gray-dark font-semibold bg-white"
        : "mt-[4px] border-b-1 border-b-gray-dark text-gray-600 hover:text-gray-800"
    }`,
  contentStyles:
    "shadow-md bg-white overflow-y-auto py-[20px]" +
    "px-[16px] border-r-gray-dark border-r-1 border-l-1 " +
    "border-l-gray-dark border-b-1 border-b-gray-dark",
};
export interface TabsProps {
  children: ReactElement<TabProps>[] | ReactElement<TabProps>;
  defaultValue?: string;
  styles?: TabsStyles;
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, styles = defaultStyles }) => {
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultValue || tabs[0]?.props.value || ""
  );

  const selectedTab = tabs.find((tab) => tab.props.value === selectedValue);

  const handleTabSelect = (value: string) => {
    setSelectedValue(value);
  };

  return (
    <div className="block">
      <div className="flex">
        {tabs.map((tab) => {
          const { label, value } = tab.props;
          const isSelected = value === selectedValue;

          return (
            <button
              key={value}
              data-testid={`button-${value}`}
              onClick={() => handleTabSelect(value)}
              className={styles.getButtonStyles(isSelected)}
              aria-selected={isSelected}
            >
              <div className="flex items-center gap-1">{label}</div>
            </button>
          );
        })}
        <div className="flex-1 border-b-1 border-b-gray-dark"></div>
      </div>

      <div className={styles.contentStyles}>{selectedTab?.props.children}</div>
    </div>
  );
};
