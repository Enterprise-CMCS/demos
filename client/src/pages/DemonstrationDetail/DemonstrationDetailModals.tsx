import React from "react";

import { AmendmentDialog } from "components/dialog/AmendmentDialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { ExtensionDialog } from "components/dialog/ExtensionDialog";

type EntityCreationModal = "amendment" | "extension" | "document" | null;

interface DemonstrationDetailModalsProps {
  entityCreationModal: EntityCreationModal;
  demonstrationId: string;
  onCloseEntityModal: () => void;
}

export const DemonstrationDetailModals: React.FC<DemonstrationDetailModalsProps> = ({
  entityCreationModal,
  demonstrationId,
  onCloseEntityModal,
}) => (
  <>
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
        applicationId={demonstrationId}
      />
    )}
  </>
);
