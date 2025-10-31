import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { EditDemonstrationDialog } from "components/dialog";
import { EditIcon } from "components/icons";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";

export const SummaryDetailsTab: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-md border-b border-gray-200 pb-1">
        <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
        <SecondaryButton
          name="button-edit-details"
          size="small"
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Details
          <EditIcon className="w-2 h-2" />
        </SecondaryButton>
      </div>

      <SummaryDetailsTable demonstrationId={demonstrationId} />

      {isEditModalOpen && (
        <EditDemonstrationDialog
          isOpen={true}
          demonstrationId={demonstrationId}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};
