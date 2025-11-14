import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { ModificationTable, ModificationTableRow } from "components/table/tables/ModificationTable";
import { useDialog } from "components/dialog/DialogContext";

export const AmendmentsTab: React.FC<{
  demonstrationId: string;
  amendments: ModificationTableRow[];
  initiallyExpandedId?: string;
}> = ({ demonstrationId, amendments, initiallyExpandedId }) => {
  const { showCreateAmendmentDialog } = useDialog();
  return (
    <div className="p-2">
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-amendment"
          size="small"
          onClick={() => showCreateAmendmentDialog(demonstrationId)}
        >
          Add New
        </IconButton>
      </div>
      <ModificationTable
        modificationType="Amendment"
        modifications={amendments}
        initiallyExpandedId={initiallyExpandedId}
      />
    </div>
  );
};
