import React, { useState } from "react";
import { compareAsc } from "date-fns";
import { ModificationTabSideNav } from "./ModificationTabSideNav";
import { DemonstrationDetailModification } from "../DemonstrationDetail";

const STYLES = {
  modificationContainer: "flex flex-col gap-2",
  tabList: "flex flex-row gap-1 border-b border-border-rules",
  tab: "cursor-pointer p-0.5 font-normal",
  selectedTab: "border-b-4 font-semibold border-border-selected",
};

export type ModificationItem = DemonstrationDetailModification & {
  modificationType: "amendment" | "extension";
};

const ModificationTab = ({
  modificationItem,
  handleTabSelect,
  isSelected,
}: {
  modificationItem: ModificationItem;
  handleTabSelect: (item: ModificationItem) => void;
  isSelected: boolean;
}) => {
  const key = `modification-tab-${modificationItem.id}`;

  return (
    <button
      key={key}
      data-testid={key}
      onClick={() => handleTabSelect(modificationItem)}
      aria-selected={isSelected}
      className={`${STYLES.tab} ${isSelected ? STYLES.selectedTab : ""}`}
    >
      {modificationItem.name}
    </button>
  );
};

const sortTabsNewestFirst = (items: ModificationItem[]): ModificationItem[] => {
  return [...items].sort((a, b) => {
    return compareAsc(b.createdAt, a.createdAt);
  });
};

export const ModificationTabs = ({ items }: { items: ModificationItem[] }) => {
  if (items.length === 0) {
    return null;
  }

  const sortedItems = sortTabsNewestFirst(items);
  const [selectedId, setSelectedId] = useState<string>(sortedItems[0]?.id ?? "");
  const [selectedItem, setSelectedItem] = useState<ModificationItem>(sortedItems[0]);

  const handleTabSelect = (item: ModificationItem) => {
    setSelectedId(item.id);
    setSelectedItem(item);
  };

  return (
    <div className={STYLES.modificationContainer}>
      <div className={STYLES.tabList}>
        {sortedItems.map((item) => (
          <ModificationTab
            key={item.id}
            modificationItem={item}
            handleTabSelect={handleTabSelect}
            isSelected={item.id === selectedId}
          />
        ))}
      </div>
      <ModificationTabSideNav modificationItem={selectedItem} />
    </div>
  );
};
