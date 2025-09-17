import React from "react";
import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { AmendmentsTable } from "components/table/tables/AmendmentsTable";

export const AmendmentsTab: React.FC<{
  onClick: () => void;
  initiallyExpandedId?: string;
}> = ({ onClick, initiallyExpandedId }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
      <SecondaryButton name="add-new-amendment" size="small" onClick={onClick}>
        <div className="flex items-center gap-1">
          Add New
          <AddNewIcon className="w-2 h-2" />
        </div>
      </SecondaryButton>
    </div>
    <AmendmentsTable initiallyExpandedId={initiallyExpandedId} />
  </div>
);
