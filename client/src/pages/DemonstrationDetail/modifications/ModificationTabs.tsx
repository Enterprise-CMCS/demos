import React, { useState, useEffect } from "react";
import { compareAsc } from "date-fns";
import type { Amendment, Extension } from "demos-server";
import { SelectedModification } from "./SelectedModification";

const STYLES = {
  modificationContainer: "flex flex-col gap-2",
  tabList: "flex flex-row gap-1 border-b border-border-rules",
  tab: "cursor-pointer p-0.5 font-normal",
  selectedTab: "border-b-4 font-semibold border-border-selected",
};

export type ModificationListItem = Pick<Amendment | Extension, "id" | "name" | "createdAt"> & {
  modificationType: "amendment" | "extension";
  medicaidId: string;
};

const ModificationTab = ({
  modificationItem,
  handleTabSelect,
  isSelected,
}: {
  modificationItem: ModificationListItem;
  handleTabSelect: (item: ModificationListItem) => void;
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

const sortTabsNewestFirst = (items: ModificationListItem[]): ModificationListItem[] => {
  return [...items].sort((a, b) => {
    return compareAsc(b.createdAt, a.createdAt);
  });
};

export const ModificationTabs = ({
  items,
  selectedItemId,
}: {
  items: ModificationListItem[];
  selectedItemId?: string;
}) => {
  if (items.length === 0) {
    return null;
  }

  const sortedItems = sortTabsNewestFirst(items);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (selectedItemId && sortedItems.map((item) => item.id).includes(selectedItemId)) {
      return selectedItemId;
    }
    return sortedItems[0]?.id || "";
  });
  useEffect(() => {
    if (!sortedItems.some((item) => item.id === selectedId)) {
      setSelectedId(sortedItems[0]?.id ?? "");
    }
  }, [selectedId, sortedItems]);

  const handleTabSelect = (item: ModificationListItem) => {
    setSelectedId(item.id);
  };
  const selectedItem = sortedItems.find((item) => item.id === selectedId) ?? sortedItems[0];

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
      {selectedItem && (
        <SelectedModification
          id={selectedItem.id}
          medicaidId={selectedItem.medicaidId}
          modificationType={selectedItem.modificationType}
        />
      )}
    </div>
  );
};
