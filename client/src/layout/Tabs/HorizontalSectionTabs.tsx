import React from "react";
import { TabsProps, Tabs, TabsStyles } from "./Tabs";

export const HorizontalSectionTabs: React.FC<Omit<TabsProps, "styles">> = ({
  children,
  defaultValue,
  onSelect,
}) => {
  const styles: TabsStyles = {
    getButtonStyles: (isSelected: boolean) =>
      `p-1 font-medium cursor-pointer ${
        isSelected
          ? "border-b-5 border-b-focus text-color-gray-base font-semibold"
          : "border-b-2 border-gray-200 text-gray-600 hover:text-gray-800"
      }`,
    contentStyles: "pt-2",
  };

  return (
    <Tabs defaultValue={defaultValue} styles={styles} onSelect={onSelect}>
      {children}
    </Tabs>
  );
};
