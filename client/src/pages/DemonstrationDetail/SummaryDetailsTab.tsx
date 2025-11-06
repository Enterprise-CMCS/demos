import React from "react";

import { SecondaryButton } from "components/button";
import { EditIcon } from "components/icons";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { useDialog } from "components/dialog/DialogContext";

export const SummaryDetailsTab: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { showEditDemonstrationDialog } = useDialog();
  return (
    <>
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
        <SecondaryButton
          name="button-edit-details"
          size="small"
          onClick={() => showEditDemonstrationDialog(demonstrationId)}
        >
          Edit Details
          <EditIcon className="w-2 h-2" />
        </SecondaryButton>
      </div>

      <SummaryDetailsTable demonstrationId={demonstrationId} />
    </>
  );
};
