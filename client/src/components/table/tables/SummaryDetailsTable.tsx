import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { EditIcon } from "components/icons";
import { DemonstrationModal } from "components/modal/DemonstrationModal";
import { Demonstration } from "demos-server";
import { tw } from "tags/tw";
import { renderDate } from "util/RenderDate";

type Props = {
  demonstration?: Demonstration;
  onEdit?: () => void;
};

const LABEL_CLASSES = tw`text-text-font font-bold text-xs uppercase tracking-wide`;
const VALUE_CLASSES = tw`text-text-font text-sm leading-relaxed`;

export const SummaryDetailsTable: React.FC<Props> = ({ demonstration, onEdit }) => {
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

  if (!demonstration) {
    return (
      <div className="border border-gray-300 bg-white p-2 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
          <SecondaryButton
            size="small"
            onClick={handleEditClick}
            className="flex items-center gap-1"
            disabled
          >
            <EditIcon className="w-2 h-2" />
            Edit Details
          </SecondaryButton>
        </div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <div className="col-span-2 text-center text-gray-500 py-8">
            No demonstration data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 bg-white p-2 shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
        <SecondaryButton size="small" onClick={handleEditClick} className="flex items-center gap-1">
          <EditIcon className="w-2 h-2" />
          Edit Details
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
        <div>
          <div className={LABEL_CLASSES}>State/Territory</div>
          <div className={VALUE_CLASSES}>{demonstration.state?.name || "-"}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Demonstration (Max Limit - 128 Characters)</div>
          <div className={VALUE_CLASSES}>{demonstration.name || "-"}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Project Officer</div>
          <div className={VALUE_CLASSES}>{demonstration.projectOfficer?.fullName || "-"}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Status</div>
          <div className={VALUE_CLASSES}>{demonstration.demonstrationStatus?.name || "-"}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Effective Date</div>
          <div className={VALUE_CLASSES}>
            {demonstration.effectiveDate ? renderDate(demonstration.effectiveDate) : "-"}
          </div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Expiration Date</div>
          <div className={VALUE_CLASSES}>
            {demonstration.expirationDate ? renderDate(demonstration.expirationDate) : "-"}
          </div>
        </div>

        <div className="col-span-2">
          <div className={LABEL_CLASSES}>
            Demonstration Description (Max Limit - 2048 Characters)
          </div>
          <div className={VALUE_CLASSES}>{demonstration.description || "-"}</div>
        </div>
      </div>

      {isEditModalOpen && demonstration && (
        <DemonstrationModal mode="edit" demonstration={demonstration} onClose={handleCloseModal} />
      )}
    </div>
  );
};
