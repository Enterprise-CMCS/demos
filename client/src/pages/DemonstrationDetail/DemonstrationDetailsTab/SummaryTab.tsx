import { SecondaryButton } from "components/button";
import { DemonstrationDialog } from "components/dialog";
import { EditIcon } from "components/icons";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { Demonstration, DemonstrationStatus, State, User } from "demos-server";
import React, { useState } from "react";

type SummaryTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  state: Pick<State, "id" | "name">;
  projectOfficer: Pick<User, "id" | "fullName">;
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

type SummaryTabProps = {
  demonstration: SummaryTabDemonstration;
  onEdit?: () => void;
};

export const SummaryTab: React.FC<SummaryTabProps> = ({ demonstration, onEdit }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setIsEditModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="border border-gray-300 bg-white p-2 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
          <SecondaryButton name="edit-details" size="small" onClick={handleEditClick}>
            <div className="flex items-center gap-1">
              <EditIcon className="w-2 h-2" />
              Edit Details
            </div>
          </SecondaryButton>
        </div>
        <SummaryDetailsTable demonstration={demonstration} />
        {isEditModalOpen && demonstration && (
          <DemonstrationDialog
            mode="edit"
            demonstration={demonstration}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </>
  );
};
