import React, { useState, ReactElement, Children } from "react";

export interface TabProps {
  label: React.ReactNode;
  value: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: ReactElement<TabProps>[] | ReactElement<TabProps>;
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue,
  orientation = "horizontal",
}) => {
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultValue || tabs[0]?.props.value || ""
  );

  const handleTabChange = (newValue: string) => {
    setSelectedValue(newValue);
  };

  const selectedTab = tabs.find((tab) => tab.props.value === selectedValue);

  const isVertical = orientation === "vertical";

  return (
    <div className={isVertical ? "flex" : ""}>
      {/* Tab List */}
      <div className={isVertical ? "" : "border-b border-gray-300 mb-6"}>
        <ul className={isVertical ? "flex flex-col" : "flex -mb-px h-12"}>
          {tabs.map((tab) => {
            const { label, value, icon } = tab.props;
            const isSelected = value === selectedValue;

            const getSelectedStyles = () => {
              if (isSelected) {
                return isVertical
                  ? "border-r-4 border-brand text-brand font-semibold"
                  : "border-b-5 text-brand font-semibold";
              }
              return "text-gray-600 hover:text-gray-800";
            };

            return (
              <li key={value}>
                <button
                  data-testid={`button-${value}`}
                  onClick={() => handleTabChange(value)}
                  className={
                    "p-1 font-medium cursor-pointer " +
                    getSelectedStyles() +
                    (isVertical ? " w-full text-left" : "")
                  }
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-1">
                    {icon}
                    {label}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tab Content */}
      <div className={isVertical ? "flex-1" : "mt-4 h-[60vh] overflow-y-auto"}>
        {selectedTab?.props.children}
      </div>
    </div>
  );
};
