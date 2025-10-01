import React from "react";

import { CreateAmendmentDialog } from "components/dialog/CreateAmendmentDialog";
import { EditDemonstrationDialog } from "components/dialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { ExtensionDialog } from "components/dialog/ExtensionDialog";
import { Demonstration } from "demos-server";

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

export type DemonstrationDialogDetails = {
  id: Demonstration["id"];
  state: Pick<Demonstration["state"], "id">;
  description: Demonstration["description"];
  name: Demonstration["name"];
};

interface DemonstrationDetailModalsProps {
  entityCreationModal: EntityCreationModal;
  demonstrationActionModal: DemonstrationActionModal;
  demonstration: DemonstrationDialogDetails;
  onCloseEntityModal: () => void;
  onCloseDemonstrationDialog: () => void;
}

export const DemonstrationDetailModals: React.FC<DemonstrationDetailModalsProps> = ({
  entityCreationModal,
  demonstrationActionModal,
  demonstration,
  onCloseEntityModal,
  onCloseDemonstrationDialog,
}) => (
  <>
    {/* Entity Creation Modals */}
    {entityCreationModal === "amendment" && (
      <CreateAmendmentDialog mode="add" demonstrationId={demonstration.id} onClose={onCloseEntityModal} />
    )}

    {entityCreationModal === "extension" && (
      <ExtensionDialog mode="add" demonstrationId={demonstration.id} onClose={onCloseEntityModal} />
    )}

    {entityCreationModal === "document" && (
      <AddDocumentDialog isOpen={true} onClose={onCloseEntityModal} />
    )}

    {/* Demonstration Action Modals */}
    {demonstrationActionModal === "edit" && (
      <EditDemonstrationDialog
        isOpen={true}
        onClose={onCloseDemonstrationDialog}
        demonstrationId={demonstration.id}
      />
    )}

    {/* TODO: Add delete confirmation modal when available */}
    {demonstrationActionModal === "delete" && (
      <div>
        <p>Delete functionality not yet implemented</p>
      </div>
    )}
  </>
);
