import React from "react";

import { EditDemonstrationDialog } from "components/dialog";
import { AmendmentDialog } from "components/dialog/AmendmentDialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { ExtensionDialog } from "components/dialog/ExtensionDialog";

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

interface DemonstrationDetailModalsProps {
  entityCreationModal: EntityCreationModal;
  demonstrationActionModal: DemonstrationActionModal;
  demonstrationId: string;
  onCloseEntityModal: () => void;
  onCloseDemonstrationDialog: () => void;
}

export const DemonstrationDetailModals: React.FC<DemonstrationDetailModalsProps> = ({
  entityCreationModal,
  demonstrationActionModal,
  demonstrationId,
  onCloseEntityModal,
  onCloseDemonstrationDialog,
}) => (
  <>
    {/* Entity Creation Modals */}
    {entityCreationModal === "amendment" && (
      <AmendmentDialog mode="add" demonstrationId={demonstrationId} onClose={onCloseEntityModal} />
    )}

    {entityCreationModal === "extension" && (
      <ExtensionDialog mode="add" demonstrationId={demonstrationId} onClose={onCloseEntityModal} />
    )}

    {entityCreationModal === "document" && (
      <AddDocumentDialog
        isOpen={true}
        onClose={onCloseEntityModal}
        initialDocument={{
          id: demonstrationId,
          name: "",
          description: "",
          documentType: "General File",
          file: null,
        }}
      />
    )}

    {/* Demonstration Action Modals */}
    {demonstrationActionModal === "edit" && (
      <EditDemonstrationDialog
        isOpen={true}
        onClose={onCloseDemonstrationDialog}
        demonstrationId={demonstrationId}
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
