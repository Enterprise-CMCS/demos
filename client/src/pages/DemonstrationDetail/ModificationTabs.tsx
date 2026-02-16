import React, { useState } from "react";

export interface ModificationItem {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  createdAt?: Date | string;
}

export interface ModificationTabsProps {
  items: ModificationItem[];
  onSelect?: (item: ModificationItem) => void;
}

export const ModificationTabs: React.FC<ModificationTabsProps> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return null;
  }

  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? "");
  const selectedItem = items.find((item) => item.id === selectedId);

  const handleTabSelect = (item: ModificationItem) => {
    setSelectedId(item.id);
    onSelect?.(item);
  };

  return (
    <div>
      <div>
        {items.map((item) => (
          <button
            key={item.id}
            data-testid={`modification-tab-${item.id}`}
            onClick={() => handleTabSelect(item)}
            aria-selected={item.id === selectedId}
          >
            {item.name}
          </button>
        ))}
      </div>

      {selectedItem && (
        <div>
          <div>{selectedItem.name}</div>
          {selectedItem.description && <div>{selectedItem.description}</div>}
          {selectedItem.status && <div>Status: {selectedItem.status}</div>}
        </div>
      )}
    </div>
  );
};
