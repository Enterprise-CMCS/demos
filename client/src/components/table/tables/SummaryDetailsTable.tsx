import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { EditDemonstrationDialog } from "components/dialog";
import { EditIcon } from "components/icons";
import {
  BundleStatus,
  Demonstration,
  DemonstrationRoleAssignment,
  Person,
  State,
} from "demos-server";
import { tw } from "tags/tw";
import { safeDateFormat } from "util/formatDate";

type SummaryDetailsDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "sdgDivision" | "signatureLevel"
> & {
  effectiveDate: Date | string | null;
  expirationDate: Date | string | null;
  state: Pick<State, "name" | "id">;
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "fullName">;
  })[];
  status: BundleStatus;
};

type Props = {
  demonstration: SummaryDetailsDemonstration;
  onEdit?: () => void;
};

const LABEL_CLASSES = tw`text-text-font font-bold text-xs tracking-wide`;
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

  return (
    <div className="border border-gray-300 bg-white p-2 shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-brand font-bold text-md uppercase tracking-wide">Summary Details</h2>
        <SecondaryButton name="button-edit-details" size="small" onClick={handleEditClick}>
          <div className="flex items-center gap-1">
            <EditIcon className="w-2 h-2" />
            Edit Details
          </div>
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
        <div>
          <div className={LABEL_CLASSES}>State/Territory</div>
          <div className={VALUE_CLASSES}>{demonstration.state.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Demonstration (Max Limit - 128 Characters)</div>
          <div className={VALUE_CLASSES}>{demonstration.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Project Officer</div>
          <div className={VALUE_CLASSES}>
            {(() => {
              const primaryProjectOfficer = demonstration.roles.find(
                (role) => role.role === "Project Officer" && role.isPrimary === true
              );

              if (!primaryProjectOfficer) {
                throw new Error(
                  `No primary project officer found for demonstration ${demonstration.id}`
                );
              }

              return primaryProjectOfficer.person.fullName;
            })()}
          </div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Status</div>
          <div className={VALUE_CLASSES}>{demonstration.status}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Effective Date</div>
          <div className={VALUE_CLASSES}>{safeDateFormat(demonstration.effectiveDate)}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Expiration Date</div>
          <div className={VALUE_CLASSES}>{safeDateFormat(demonstration.expirationDate)}</div>
        </div>

        <div className="col-span-2">
          <div className={LABEL_CLASSES}>
            Demonstration Description (Max Limit - 2048 Characters)
          </div>
          <div className={VALUE_CLASSES}>{demonstration.description}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>SDG Division</div>
          <div className={VALUE_CLASSES}>
            {demonstration.sdgDivision ? demonstration.sdgDivision : "--"}
          </div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Signature Level</div>
          <div className={VALUE_CLASSES}>
            {demonstration.signatureLevel ? demonstration.signatureLevel : "--"}
          </div>
        </div>
      </div>

      {isEditModalOpen && demonstration && (
        <EditDemonstrationDialog
          isOpen={true}
          demonstrationId={demonstration.id}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
