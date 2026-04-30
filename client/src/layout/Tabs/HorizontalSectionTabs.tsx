import React from "react";
import { TabsProps, Tabs, TabsStyles } from "./Tabs";

type HorizontalSectionTabsProps = Omit<TabsProps, "styles"> & {
  variant?: "default" | "bordered";
};

export const HorizontalSectionTabs: React.FC<HorizontalSectionTabsProps> = ({
  children,
  defaultValue,
  onSelect,
  variant = "default",
}) => {
  const defaultStyles: TabsStyles = {
    getButtonStyles: (isSelected: boolean) =>
      `p-1 font-medium cursor-pointer ${
        isSelected
          ? "border-b-5 border-b-focus text-color-gray-base font-semibold"
          : "border-b-2 border-gray-200 text-gray-600 hover:text-gray-800"
      }`,
    contentStyles: "pt-2",
  };
  const borderedStyles: TabsStyles = {
    getButtonStyles: (isSelected: boolean) =>
      `p-1 font-medium cursor-pointer bg-white ${
        isSelected
          ? "border-t-4 border-t-focus border-r-1 border-r-gray-dark border-l-1 border-l-gray-dark text-color-gray-base font-semibold"
          : "mt-[4px] border-b-1 border-b-gray-dark text-gray-600 hover:text-gray-800"
      }`,
    contentStyles: "pt-2",
  };
  const styles = variant === "bordered" ? borderedStyles : defaultStyles;

  return (
    <Tabs defaultValue={defaultValue} styles={styles} onSelect={onSelect}>
      {children}
    </Tabs>
  );
};
