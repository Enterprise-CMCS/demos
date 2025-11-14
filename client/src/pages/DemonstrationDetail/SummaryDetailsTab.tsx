import React from "react";

import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { useDialog } from "components/dialog/DialogContext";

export const SummaryDetailsTab: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { showEditDemonstrationDialog } = useDialog();
  return (
    <>
      <div className="flex justify-between items-center mb-md border-b border-gray-200 pb-1">
        <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
        <IconButton
          icon={<EditIcon />}
          name="button-edit-details"
          size="small"
          onClick={() => showEditDemonstrationDialog(demonstrationId)}
        >
          Edit Details
        </IconButton>
      </div>

      <SummaryDetailsTable demonstrationId={demonstrationId} />
    </>
  );
};
