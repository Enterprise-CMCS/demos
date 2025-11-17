import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { AmendmentTable } from "components/table/tables/AmendmentTable";

export const AmendmentsTab: React.FC<{
  demonstrationId: string;
  initiallyExpandedId?: string;
}> = ({ demonstrationId, initiallyExpandedId }) => {
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
      <AmendmentTable
        demonstrationId={demonstrationId}
        initiallyExpandedId={initiallyExpandedId}
      />
    </div>
  );
};
