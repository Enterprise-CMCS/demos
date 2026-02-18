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

export const ModificationTabs = ({ items }: { items: ModificationItem[] }) => {
  if (items.length === 0) {
    return null;
  }

  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? "");
  const [selectedItem, setSelectedItem] = useState<ModificationItem>(items[0]);

  const handleTabSelect = (item: ModificationItem) => {
    setSelectedId(item.id);
    setSelectedItem(item);
  };

  return (
    <div className={STYLES.modificationContainer}>
      <div className={STYLES.tabList}>
        {items.map((item) => (
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
