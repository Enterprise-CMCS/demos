import React from "react";

import { CreateNewModal } from "components/modal/CreateNewModal";
import { Demonstration } from "demos-server";

export const DemonstrationDetailModals: React.FC<{
  modalType: string;
  demonstration: Demonstration;
  handleOnClose: () => void;
}> = ({ modalType, demonstration, handleOnClose }) => (
  <>
    {modalType === "amendment" && demonstration && (
      <CreateNewModal
        mode="amendment"
        data={{ demonstration: demonstration.id }}
        onClose={handleOnClose}
      />
    )}

    {modalType === "extension" && demonstration && (
      <CreateNewModal
        mode="extension"
        data={{ demonstration: demonstration.id }}
        onClose={handleOnClose}
      />
    )}

    {modalType === "document" && demonstration && (
      <CreateNewModal
        mode="document"
        data={{
          demonstration: demonstration.id,
          state: demonstration.state?.id,
          projectOfficer: demonstration.description,
        }}
        onClose={handleOnClose}
      />
    )}

    {modalType === "edit" && demonstration && (
      <CreateNewModal
        mode="demonstration"
        data={{
          title: demonstration.name,
          state: demonstration.state?.id,
          projectOfficer: demonstration.description,
          description: demonstration.description,
        }}
        onClose={handleOnClose}
      />
    )}
  </>
);
