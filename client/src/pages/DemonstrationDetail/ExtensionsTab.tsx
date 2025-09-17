import React from "react";
import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { ExtensionsTable } from "components/table/tables/ExtensionsTable";

export const ExtensionsTab: React.FC<{
  onClick: () => void;
  initiallyExpandedId?: string;
}> = ({ onClick, initiallyExpandedId }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Extensions</h1>
      <SecondaryButton name="add-new-extension" size="small" onClick={onClick}>
        <div className="flex items-center gap-1">
          Add New
          <AddNewIcon className="w-2 h-2" />
        </div>
      </SecondaryButton>
    </div>
    <ExtensionsTable initiallyExpandedId={initiallyExpandedId} />
  </div>
);
