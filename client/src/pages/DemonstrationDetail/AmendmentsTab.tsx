import React from "react";
import { Demonstration } from "demos-server";
import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { AmendmentTable } from "components/table/tables/AmendmentTable";
import { mockAmendments } from "mock-data/amendmentMocks";

export const AmendmentsTab: React.FC<{
  demonstration: Demonstration;
  onClick: () => void;
  initiallyExpandedId?: string;
}> = ({ demonstration, onClick, initiallyExpandedId }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
      <SecondaryButton
        size="small"
        className="flex items-center gap-1 px-1 py-1"
        onClick={onClick}
      >
        <span>Add New</span>
        <AddNewIcon className="w-2 h-2" />
      </SecondaryButton>
    </div>
    <AmendmentTable
      data={mockAmendments}
      demonstrationId={demonstration.id}
      initiallyExpandedId={initiallyExpandedId}
    />
  </div>
);
