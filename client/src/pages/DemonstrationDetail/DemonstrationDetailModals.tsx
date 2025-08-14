import React from "react";

import { CreateNewModal } from "components/modal/CreateNewModal";
import { DocumentModal } from "components/modal/document/DocumentModal";
import { Demonstration } from "demos-server";

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

interface DemonstrationDetailModalsProps {
  entityCreationModal: EntityCreationModal;
  demonstrationActionModal: DemonstrationActionModal;
  demonstration: Demonstration;
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
      <CreateNewModal
        mode="amendment"
        data={{ demonstration: demonstration.id }}
        onClose={onCloseEntityModal}
      />
    )}

    {entityCreationModal === "extension" && (
      <CreateNewModal
        mode="extension"
        data={{ demonstration: demonstration.id }}
        onClose={onCloseEntityModal}
      />
    )}

    {entityCreationModal === "document" && (
      <DocumentModal
        mode="add document"
        data={{
          demonstration: demonstration.id,
          state: demonstration.state?.id,
          projectOfficer: demonstration.description,
        }}
        onClose={onCloseEntityModal}
      />
    )}

    {/* Demonstration Action Modals */}
    {demonstrationActionModal === "edit" && (
      <CreateNewModal
        mode="demonstration"
        data={{
          title: demonstration.name,
          state: demonstration.state?.id,
          projectOfficer: demonstration.description,
          description: demonstration.description,
        }}
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
