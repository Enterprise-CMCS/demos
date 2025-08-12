import React from "react";
import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { ModificationTable, ModificationTableRow } from "components/table/tables/ModificationTable";

export const ExtensionsTab: React.FC<{
  extensions: ModificationTableRow[];
  onClick: () => void;
  initiallyExpandedId?: string;
}> = ({ extensions, onClick, initiallyExpandedId }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Extensions</h1>
      <SecondaryButton size="small" className="flex items-center gap-1 px-1 py-1" onClick={onClick}>
        <span>Add New</span>
        <AddNewIcon className="w-2 h-2" />
      </SecondaryButton>
    </div>
    <ModificationTable modifications={extensions} initiallyExpandedId={initiallyExpandedId} />
  </div>
);
