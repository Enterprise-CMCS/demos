// src/components/ui/Tabs.tsx
import React from "react";

export interface TabItem {
  label: string;
  count: number;
  value: string;
}

interface TabsProps {
  tabs: TabItem[];
  selectedValue: string;
  onChange: (newValue: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, selectedValue, onChange }) => {
  return (
    <div className="border-b border-gray-300 mb-2">
      <ul className="flex -mb-px">
        {tabs.map((tab) => {
          const isSelected = tab.value === selectedValue;
          return (
            <li key={tab.value} className="mr-4">
              <button
                onClick={() => onChange(tab.value)}
                className={
                  "inline-block px-4 py-2 font-medium " +
                  (isSelected
                    ? "border-b-2 border-[var(--color-brand)] text-brand"
                    : "text-gray-600 hover:text-gray-800")
                }
              >
                {tab.label} ({tab.count})
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
