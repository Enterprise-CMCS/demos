import React from "react";

export interface TabItem {
  label: string;
  count?: number;
  value: string;
}

interface TabsProps {
  tabs: TabItem[];
  selectedValue: string;
  onChange: (newValue: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, selectedValue, onChange }) => {
  const tabStyles = "flex border-b border-gray-300 mb-[24px] h-[48px]";

  return (
    <div className={tabStyles}>
      {tabs.map((tab) => {
        const isSelected = tab.value === selectedValue;
        const getSelectedStyles = () => {
          return isSelected
            ? "border-b-5 text-brand font-semibold"
            : "text-gray-600 hover:text-gray-800";
        };
        return (
          <button
            key={tab.value}
            data-testid={`button-${tab.value}`}
            onClick={() => onChange(tab.value)}
            className={"p-1 font-medium cursor-pointer " + getSelectedStyles()}
            aria-selected={isSelected}
          >
            {tab.label}
            {tab.count != null && ` (${tab.count})`}
          </button>
        );
      })}
    </div>
  );
};
