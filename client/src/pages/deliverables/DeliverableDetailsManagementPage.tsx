import React, { useCallback, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { Deliverable, Demonstration } from "demos-server";
import { CommentBox } from "pages/deliverables/sections/CommentBox";
import { DeliverableInfoFields } from "pages/deliverables/sections/DeliverableInfoFields";
import type { DeliverableFileRow } from "pages/deliverables/sections/DeliverableFileTypes";
import { FileAndHistoryTabs } from "pages/deliverables/sections/FileAndHistoryTabs";
import { EditAndDeleteButtonGroup } from "pages/DemonstrationDetail/deliverables/EditAndDeleteButtonGroup";
import { PendingReviewNotice } from "pages/DemonstrationDetail/deliverables/PendingReviewNotice";

export const GET_DELIVERABLE_DETAILS_QUERY_NAME = "GetDeliverableDetails";
export const DELIVERABLE_DETAILS_QUERY = gql`
  query ${GET_DELIVERABLE_DETAILS_QUERY_NAME}($id: ID!) {
    deliverable(id: $id) {
      id
      name
      deliverableType
      dueDate
      status
      demonstration {
        id
        name
        expirationDate
        state {
          id
        }
      }
      cmsOwner {
        person {
          fullName
        }
      }
      stateDocuments {
        id
        name
        description
        documentType
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
      cmsDocuments {
        id
        name
        description
        documentType
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export type DeliverableDetailsManagementDeliverable = Pick<
  Deliverable,
  "id" | "deliverableType" | "dueDate" | "status" | "name"
> & {
  demonstration: Pick<Demonstration, "id" | "name" | "expirationDate"> & { state: { id: string } };
  cmsOwner: { person: { fullName: string } };
  stateDocuments: DeliverableFileRow[];
  cmsDocuments: DeliverableFileRow[];
};

export const DeliverableDetailsManagementPage: React.FC<{
  deliverableId: string;
  onBack: () => void;
}> = ({ deliverableId, onBack }) => {
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showSubmissionPendingNotice, setShowSubmissionPendingNotice] = useState(true);
  const { id: demonstrationId } = useParams<{ id?: string }>();
  const { data, loading, error } = useQuery<{
    deliverable: DeliverableDetailsManagementDeliverable;
  }>(DELIVERABLE_DETAILS_QUERY, { variables: { id: deliverableId } });

  const handleToggleAdditionalDetails = useCallback(() => {
    setShowAdditionalDetails((prev) => !prev);
  }, []);
  const handleDeleteDeliverable = useCallback(() => {
    // TODO: Add delete deliverable logic here.
  }, []);
  const handleEditDeliverable = useCallback(() => {
    // TODO: Add edit deliverable logic here.
  }, []);
  const handleStartReview = useCallback(() => {
    // TODO: Add "Start Review" business logic here.
    setShowSubmissionPendingNotice(false);
  }, []);

  if (loading) {
    return <div className="p-4">Loading deliverable...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading deliverable.</div>;
  }

  if (!data?.deliverable) {
    return <div className="p-4">Deliverable not found.</div>;
  }
  if (demonstrationId && data.deliverable.demonstration.id !== demonstrationId) {
    return <div className="p-4">Deliverable not found.</div>;
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="shadow-md bg-white p-[16px] h-full flex flex-col">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex justify-between items-start gap-2">
            <DeliverableInfoFields
              deliverable={data.deliverable}
              onBack={onBack}
              title={data.deliverable.name}
              showAdditionalDetailsToggle
              showAdditionalDetails={showAdditionalDetails}
              onToggleAdditionalDetails={handleToggleAdditionalDetails}
            />
            <EditAndDeleteButtonGroup
              onDelete={handleDeleteDeliverable}
              onEdit={handleEditDeliverable}
            />
          </div>
          {showSubmissionPendingNotice ? (
            <PendingReviewNotice onStartReview={handleStartReview} />
          ) : null}
          <div className="flex w-full gap-2 flex-1">
            <div className="flex-1">
              <FileAndHistoryTabs deliverable={data.deliverable} />
            </div>
            <div>
              <CommentBox />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
