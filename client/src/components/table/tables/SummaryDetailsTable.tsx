import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { EditDemonstrationDialog } from "components/dialog/DemonstrationDialog";
import { EditIcon } from "components/icons";
import {
  Demonstration as ServerDemonstration,
  DemonstrationStatus,
  State,
  User,
} from "demos-server";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

export const DEMONSTRATION_SUMMARY_DETAILS_QUERY = gql`
  query DemonstrationSummaryDetails($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
      projectOfficer {
        id
        fullName
      }
      demonstrationStatus {
        name
      }
    }
  }
`;

type Demonstration = Pick<
  ServerDemonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  state: Pick<State, "name" | "id">;
  projectOfficer: Pick<User, "id" | "fullName">;
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

type Props = {
  onEdit?: () => void;
};

const LABEL_CLASSES = tw`text-text-font font-bold text-xs uppercase tracking-wide`;
const VALUE_CLASSES = tw`text-text-font text-sm leading-relaxed`;

export const SummaryDetailsTable: React.FC<Props> = ({ onEdit }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    DEMONSTRATION_SUMMARY_DETAILS_QUERY,
    {
      variables: { demonstrationId: id },
    }
  );

  if (loading) {
    return <div>Loading summary details...</div>;
  }
  if (error) {
    return <div>Error loading summary details: {error.message}</div>;
  }
  const demonstration = data?.demonstration;

  if (!demonstration) {
    return <div>No demonstration data available.</div>;
  }

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
          <div className={VALUE_CLASSES}>{demonstration.projectOfficer.fullName}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Status</div>
          <div className={VALUE_CLASSES}>{demonstration.demonstrationStatus.name}</div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Effective Date</div>
          <div className={VALUE_CLASSES}>
            {demonstration.effectiveDate ? formatDate(demonstration.effectiveDate) : "--/--/----"}
          </div>
        </div>

        <div>
          <div className={LABEL_CLASSES}>Expiration Date</div>
          <div className={VALUE_CLASSES}>
            {demonstration.expirationDate ? formatDate(demonstration.expirationDate) : "--/--/----"}
          </div>
        </div>

        <div className="col-span-2">
          <div className={LABEL_CLASSES}>
            Demonstration Description (Max Limit - 2048 Characters)
          </div>
          <div className={VALUE_CLASSES}>{demonstration.description}</div>
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
