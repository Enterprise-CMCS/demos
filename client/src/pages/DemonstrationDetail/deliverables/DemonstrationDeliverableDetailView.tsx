import React, { useCallback, useState } from "react";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { Button, CircleButton } from "components/button";
import { DeleteIcon, EditIcon, EllipsisIcon, InfoIcon } from "components/icons";
import {
  DELIVERABLE_DETAILS_QUERY,
  type DeliverableDetailsManagementDeliverable,
} from "pages/deliverables/DeliverableDetailsManagementPage";
import { CommentBox } from "pages/deliverables/sections/CommentBox";
import { DeliverableInfoFields } from "pages/deliverables/sections/DeliverableInfoFields";
import { FileAndHistoryTabs } from "pages/deliverables/sections/FileAndHistoryTabs";

const START_REVIEW_BUTTON_NAME = "button-start-review";
const DELIVERABLE_REVIEW_NOTICE_NAME = "deliverable-review-notice";

export const DemonstrationDeliverableDetailView: React.FC<{
  deliverableId: string;
  onBack: () => void;
}> = ({ deliverableId, onBack }) => {
  const [showButtons, setShowButtons] = useState(true);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [showSubmissionPendingNotice, setShowSubmissionPendingNotice] = useState(true);
  const { id: demonstrationId } = useParams<{ id?: string }>();
  const { data, loading, error } = useQuery<{ deliverable: DeliverableDetailsManagementDeliverable }>(
    DELIVERABLE_DETAILS_QUERY,
    { variables: { id: deliverableId } }
  );
  const handleToggleButtons = useCallback(() => {
    setShowButtons((prev) => !prev);
  }, []);
  const handleToggleAdditionalDetails = useCallback(() => {
    setShowAdditionalDetails((prev) => !prev);
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
            <div className="flex items-center gap-1 mt-[2px]">
              {showButtons && (
                <>
                  <button
                    type="button"
                    name="Delete deliverable"
                    data-testid="delete-deliverable-button"
                    onClick={() => {}}
                    className="inline-flex items-center justify-center text-[#CD2026] hover:opacity-80"
                  >
                    <DeleteIcon fill="currentColor" width="18" height="18" />
                  </button>
                  <button
                    type="button"
                    name="Edit deliverable"
                    data-testid="edit-deliverable-button"
                    onClick={() => {}}
                    className="inline-flex items-center justify-center text-action hover:opacity-80"
                  >
                    <EditIcon width="18" height="18" />
                  </button>
                </>
              )}
              <CircleButton
                name="Toggle deliverable options"
                data-testid="toggle-deliverable-ellipsis-button"
                size="small"
                onClick={handleToggleButtons}
              >
                <span
                  className={`transform transition-transform duration-200 ease-in-out ${
                    showButtons ? "rotate-90" : "rotate-0"
                  }`}
                >
                  <EllipsisIcon />
                </span>
              </CircleButton>
            </div>
          </div>
          {showSubmissionPendingNotice ? (
            <div
              className="flex items-center gap-1 border border-brand border-l-[6px] rounded-sm bg-info-light px-1 py-1"
              data-testid={DELIVERABLE_REVIEW_NOTICE_NAME}
            >
              <span className="shrink-0 text-brand" aria-hidden="true">
                <InfoIcon />
              </span>
              <div className="flex-1 leading-2">
                <p className="text-[15px] font-bold text-text-font">Submission pending review</p>
                <p className="text-sm text-text-font">
                  State User has submitted deliverable(s) for review
                </p>
              </div>
              <Button
                type="button"
                size="small"
                name={START_REVIEW_BUTTON_NAME}
                onClick={handleStartReview}
              >
                Start Review
              </Button>
            </div>
          ) : null}
          <div className="flex w-full gap-2 flex-1">
            <div className="flex-1">
              <FileAndHistoryTabs />
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
