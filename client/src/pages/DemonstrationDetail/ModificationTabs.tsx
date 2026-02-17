import React, { useState } from "react";

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
  const selectedStyles = isSelected ? "border-b-4 font-semibold border-border-selected" : "";

  return (
    <button
      key={modificationItem.id}
      data-testid={`modification-tab-${modificationItem.id}`}
      onClick={() => handleTabSelect(modificationItem)}
      aria-selected={isSelected}
      className={`cursor-pointer p-0.5 font-normal ${selectedStyles}`}
    >
      {modificationItem.name}
    </button>
  );
};

export const ModificationTabs = ({ items }: { items: ModificationItem[] }) => {
  if (items.length === 0) {
    return null;
  }

  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? "");

  const handleTabSelect = (item: ModificationItem) => {
    setSelectedId(item.id);
  };

  return (
    <div className="flex flex-row gap-1">
      {items.map((item) => (
        <ModificationTab
          key={item.id}
          modificationItem={item}
          handleTabSelect={handleTabSelect}
          isSelected={item.id === selectedId}
        />
      ))}
    </div>
  );
};
