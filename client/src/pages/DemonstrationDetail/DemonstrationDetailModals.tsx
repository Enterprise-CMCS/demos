import React from "react";
import { Demonstration } from "demos-server";
import { CreateNewModal } from "components/modal/CreateNewModal";

export const DemonstrationDetailModals: React.FC<{
  modalType: string;
  data: Demonstration;
  handleOnClose: () => void;
}> = ({ modalType, data, handleOnClose }) => (
  <>
    {modalType === "amendment" && data && (
      <CreateNewModal
        mode="amendment"
        data={{ demonstration: data.id }}
        onClose={handleOnClose}
      />
    )}

    {modalType === "extension" && data && (
      <CreateNewModal
        mode="extension"
        data={{ demonstration: data.id }}
        onClose={handleOnClose}
      />
    )}

    {modalType === "edit" && data && (
      <CreateNewModal
        mode="demonstration"
        data={{
          title: data.name,
          state: data.state?.id,
          projectOfficer: data.description,
          description: data.description,
        }}
        onClose={handleOnClose}
      />
    )}
  </>
);
