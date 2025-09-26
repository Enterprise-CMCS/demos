import React, { useState, ReactElement, Children } from "react";

export interface TabProps {
  label: React.ReactNode;
  value: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: ReactElement<TabProps>[] | ReactElement<TabProps>;
  defaultValue?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue }) => {
  const tabStyles = "flex border-b border-gray-300 mb-[24px] h-[48px]";

  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultValue || tabs[0]?.props.value || ""
  );

  const selectedTab = tabs.find((tab) => tab.props.value === selectedValue);

  return (
    <>
      <div className={tabStyles}>
        {tabs.map((tab) => {
          const { label, value } = tab.props;
          const isSelected = value === selectedValue;

          const getSelectedStyles = () => {
            if (isSelected) {
              return "border-b-5 text-brand font-semibold";
            }
            return "text-gray-600 hover:text-gray-800";
          };

          return (
            <button
              key={value}
              data-testid={`button-${value}`}
              onClick={() => setSelectedValue(value)}
              className={"p-1 font-medium cursor-pointer " + getSelectedStyles()}
              aria-selected={isSelected}
            >
              <div className="flex items-center gap-1">{label}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 h-[60vh] overflow-y-auto">{selectedTab?.props.children}</div>
    </>
  );
};
