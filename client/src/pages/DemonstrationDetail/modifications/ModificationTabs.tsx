import React, { useState } from "react";
import { ModificationTabSideNav } from "./ModificationTabSideNav";

const STYLES = {
  modificationContainer: "flex flex-col gap-2",
  tabList: "flex flex-row gap-1 border-b border-border-rules",
  tab: "cursor-pointer p-0.5 font-normal",
  selectedTab: "border-b-4 font-semibold border-border-selected",
};

export interface ModificationItem {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  createdAt?: Date | string;
}

const ModificationTab = ({
  modificationItem,
  handleTabSelect,
  isSelected,
}: {
  modificationItem: ModificationItem;
  handleTabSelect: (item: ModificationItem) => void;
  isSelected: boolean;
}) => {
  return (
    <button
      key={modificationItem.id}
      data-testid={`modification-tab-${modificationItem.id}`}
      onClick={() => handleTabSelect(modificationItem)}
      aria-selected={isSelected}
      className={`${STYLES.tab} ${isSelected ? STYLES.selectedTab : ""}`}
    >
      {modificationItem.name}
    </button>
  );
};

const ModificationTabContent = ({ modificationItem }: { modificationItem: ModificationItem }) => {
  return <ModificationTabSideNav modificationItem={modificationItem} />;
};

// Sorts ModificationItems by createdAt (newest first)
const sortModificationItemsByCreatedAt = (items: ModificationItem[]): ModificationItem[] => {
  return [...items].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
};

export const ModificationTabs = ({ items }: { items: ModificationItem[] }) => {
  if (items.length === 0) {
    return null;
  }

  const sortedItems = sortModificationItemsByCreatedAt(items);
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
      <ModificationTabContent modificationItem={selectedItem} />
    </div>
  );
};
