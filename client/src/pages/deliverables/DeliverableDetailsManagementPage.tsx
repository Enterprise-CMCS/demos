import React, { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Deliverable, DeliverableAction, Demonstration, PersonType } from "demos-server";
import { Loading } from "components/loading/Loading";
import { useToast } from "components/toast";
import { getCurrentUser } from "components/user/UserContext";
import { DELIVERABLE_REVIEW_STARTED_MESSAGE } from "util/messages";
import { CommentBox } from "./sections/comment_box";
import { DeliverableInfoFields } from "./sections/DeliverableInfoFields";
import { FileAndHistoryTabs } from "./sections/FileAndHistoryTabs";
import { PendingReviewNotice } from "./sections/PendingReviewNotice";
import { DeliverableButtons } from "./sections/DeliverableButtons";
import type { DeliverableFileRow } from "./sections/DeliverableFileTypes";
import { EditAndDeleteButtonGroup } from "./sections/EditAndDeleteButtonGroup";

export const START_DELIVERABLE_REVIEW_MUTATION = gql`
  mutation StartDeliverableReview($id: ID!) {
    startDeliverableReview(id: $id) {
      id
      status
    }
  }
`;

const REVIEW_STARTER_PERSON_TYPES: ReadonlySet<PersonType> = new Set([
  "demos-admin",
  "demos-cms-user",
]);

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
      deliverableActions {
        id
        actionType
        actionTimestamp
        userFullName
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
  deliverableActions: Pick<
    DeliverableAction,
    "id" | "actionType" | "actionTimestamp" | "userFullName"
  >[];
};

export const DeliverableDetailsManagementPage: React.FC<{
  deliverableId?: string;
  onBack?: () => void;
}> = ({ deliverableId, onBack }) => {
  const { currentUser } = getCurrentUser();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const { deliverableId: routeDeliverableId } = useParams<{ deliverableId?: string }>();
  const resolvedDeliverableId = deliverableId ?? routeDeliverableId;

  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  const { data, loading, error } = useQuery<{
    deliverable: DeliverableDetailsManagementDeliverable;
  }>(DELIVERABLE_DETAILS_QUERY, {
    variables: { id: resolvedDeliverableId ?? "" },
    skip: !resolvedDeliverableId,
  });

  const [startReviewTrigger, { loading: startReviewLoading }] = useMutation(
    START_DELIVERABLE_REVIEW_MUTATION
  );

  const handleToggleAdditionalDetails = useCallback(() => {
    setShowAdditionalDetails((currentValue) => !currentValue);
  }, []);

  const handleStartReview = useCallback(async () => {
    if (!resolvedDeliverableId) return;
    try {
      await startReviewTrigger({
        variables: { id: resolvedDeliverableId },
        refetchQueries: [
          { query: DELIVERABLE_DETAILS_QUERY, variables: { id: resolvedDeliverableId } },
        ],
        awaitRefetchQueries: true,
      });
      showSuccess(DELIVERABLE_REVIEW_STARTED_MESSAGE);
    } catch (mutationError) {
      console.error(mutationError);
      showError("Unable to start deliverable review.");
    }
  }, [resolvedDeliverableId, startReviewTrigger, showSuccess, showError]);

  const handleDeleteDeliverable = useCallback(() => {}, []);
  const handleEditDeliverable = useCallback(() => {}, []);

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

  const userPersonType = currentUser?.person.personType;
  const canStartReview =
    !!userPersonType &&
    REVIEW_STARTER_PERSON_TYPES.has(userPersonType) &&
    data.deliverable.status === "Submitted";

  const submitterName =
    [...data.deliverable.deliverableActions]
      .filter((action) => action.actionType === "Submitted Deliverable")
      .sort(
        (a, b) =>
          new Date(b.actionTimestamp).getTime() - new Date(a.actionTimestamp).getTime()
      )[0]?.userFullName ?? "State User";

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
          />
          <EditAndDeleteButtonGroup
            onDelete={handleDeleteDeliverable}
            onEdit={handleEditDeliverable}
          />
        </div>
        {canStartReview ? (
          <PendingReviewNotice
            submitterName={submitterName}
            onStartReview={handleStartReview}
            isSubmitting={startReviewLoading}
          />
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
  );
};
