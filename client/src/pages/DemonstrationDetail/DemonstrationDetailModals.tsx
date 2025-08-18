import React from "react";

import { DemonstrationModal } from "components/modal/DemonstrationModal";
import { AmendmentModal } from "components/modal/AmendmentModal";
import { ExtensionModal } from "components/modal/ExtensionModal";
import { AddDocumentModal } from "components/modal/document/DocumentModal";
import { Demonstration } from "demos-server";

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

export type DemonstrationModalDetails = {
  id: Demonstration["id"];
  state: Pick<Demonstration["state"], "id">;
  description: Demonstration["description"];
  name: Demonstration["name"];
};

interface DemonstrationDetailModalsProps {
  entityCreationModal: EntityCreationModal;
  demonstrationActionModal: DemonstrationActionModal;
  demonstration: DemonstrationModalDetails;
  onCloseEntityModal: () => void;
  onCloseDemonstrationModal: () => void;
}

export const DemonstrationDetailModals: React.FC<DemonstrationDetailModalsProps> = ({
  entityCreationModal,
  demonstrationActionModal,
  demonstration,
  onCloseEntityModal,
  onCloseDemonstrationModal,
}) => (
  <>
    {/* Entity Creation Modals */}
    {entityCreationModal === "amendment" && (
      <AmendmentModal
        mode="add"
        demonstrationId={demonstration.id}
        onClose={onCloseEntityModal}
      />
    )}

    {entityCreationModal === "extension" && (
      <ExtensionModal
        mode="add"
        demonstrationId={demonstration.id}
        onClose={onCloseEntityModal}
      />
    )}

    {entityCreationModal === "document" && (
      <AddDocumentModal onClose={onCloseEntityModal} />
    )}

    {/* Demonstration Action Modals */}
    {demonstrationActionModal === "edit" && (
      <DemonstrationModal
        mode="edit"
        onClose={onCloseDemonstrationModal}
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
