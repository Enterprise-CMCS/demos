import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { Deliverable, Demonstration } from "demos-server";
import { Loading } from "components/loading/Loading";
import { CommentBox } from "./sections/comment_box";
import { DeliverableInfoFields } from "./sections/DeliverableInfoFields";
import { FileAndHistoryTabs } from "./sections/FileAndHistoryTabs";
import { PendingReviewNotice } from "./sections/PendingReviewNotice";
import { DeliverableButtons } from "./sections/DeliverableButtons";
import type { DeliverableFileRow } from "./sections/DeliverableFileTypes";
import { EditAndDeleteButtonGroup } from "./sections/EditAndDeleteButtonGroup";
import { useToast } from "components/toast";

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
  deliverableId?: string;
  onBack?: () => void;
}> = ({ deliverableId, onBack }) => {
  const { showError } = useToast();
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showPendingReviewNotice, setShowPendingReviewNotice] = useState(true);
  const navigate = useNavigate();
  const { deliverableId: routeDeliverableId } = useParams<{ deliverableId?: string }>();
  const resolvedDeliverableId = deliverableId ?? routeDeliverableId;

  const { data, loading, error } = useQuery<{
    deliverable: DeliverableDetailsManagementDeliverable;
  }>(DELIVERABLE_DETAILS_QUERY, {
    variables: { id: resolvedDeliverableId ?? "" },
    skip: !resolvedDeliverableId,
  });

  const handleToggleAdditionalDetails = useCallback(() => {
    setShowAdditionalDetails((currentValue) => !currentValue);
  }, []);

  const handleStartReview = useCallback(() => {
    setShowPendingReviewNotice(false);
  }, []);

  const handleDeleteDeliverable = useCallback(() => {}, []);
  const handleEditDeliverable = useCallback(() => {}, []);
  const handleRequestResubmission = useCallback(() => {
    showError("Request resubmission is not available yet.");
  }, [showError]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }

    navigate("/deliverables");
  }, [navigate, onBack]);

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>Error loading deliverable: {error.message}</div>;
  }
  if (!resolvedDeliverableId || !data?.deliverable) {
    return <div>Deliverable not found.</div>;
  }

  return (
    <div className="shadow-md bg-white p-[16px] h-full flex flex-col">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b pb-[8px]">
        DELIVERABLES
      </h1>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start">
          <DeliverableInfoFields
            deliverable={data.deliverable}
            onBack={handleBack}
            title={data.deliverable.name}
            showAdditionalDetails={showAdditionalDetails}
            showAdditionalDetailsToggle
            onToggleAdditionalDetails={handleToggleAdditionalDetails}
          />
          {/* I'm sure these go somewhere but they arent in my spec sheet. Uncomment at your leisure */}
          <DeliverableButtons
            deliverable={data.deliverable}
            onRequestResubmission={handleRequestResubmission}
          />
          <EditAndDeleteButtonGroup
            onDelete={handleDeleteDeliverable}
            onEdit={handleEditDeliverable}
          />
        </div>
        {showPendingReviewNotice ? <PendingReviewNotice onStartReview={handleStartReview} /> : null}
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
  );
};
