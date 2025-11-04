import React from "react";
import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { ModificationTable, ModificationTableRow } from "components/table/tables/ModificationTable";
import { useModal } from "components/dialog/DialogContext";
import { CreateAmendmentDialog } from "components/dialog/Amendment/CreateAmendmentDialog";

export const AmendmentsTab: React.FC<{
  amendments: ModificationTableRow[];
  demonstrationId: string;
  initiallyExpandedId?: string;
}> = ({ amendments, demonstrationId, initiallyExpandedId }) => {
  const { showModal, hideModal } = useModal();

  const handleAddNew = () => {
    showModal(
      <CreateAmendmentDialog isOpen={true} onClose={hideModal} demonstrationId={demonstrationId} />
    );
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
        <SecondaryButton name="add-new-amendment" size="small" onClick={handleAddNew}>
          Add New
          <AddNewIcon className="w-2 h-2" />
        </SecondaryButton>
      </div>
      <ModificationTable
        modificationType="Amendment"
        modifications={amendments}
        initiallyExpandedId={initiallyExpandedId}
      />
    </div>
  );
};
