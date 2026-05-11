import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Select, Option } from "components/input/select/Select";
import { useToast } from "components/toast";

import {
  DeliverableExtensionStatus,
  DeliverableStatus,
  FinalDeliverableStatus,
} from "demos-server";
import { DELIVERABLE_REVIEW_COMPLETED_MESSAGE } from "util/messages";

import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { hasOpenExtensionRequest } from "./RequestExtensionDeliverableDialog";

export const COMPLETE_REVIEW_DIALOG_TITLE = "Complete Review";
export const COMPLETE_REVIEW_DIALOG_NAME = "complete-review-dialog";

export const COMPLETE_REVIEW_STATUS_FIELD_NAME = "complete-review-status";
export const COMPLETE_REVIEW_SUBMIT_BUTTON_NAME = "button-complete-review-submit";

export const COMPLETE_REVIEW_ELIGIBLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Under CMS Review",
]);

export const canCompleteReview = (
  status: DeliverableStatus,
  extensions: { status: DeliverableExtensionStatus }[]
): boolean =>
  COMPLETE_REVIEW_ELIGIBLE_STATUSES.has(status) && !hasOpenExtensionRequest(extensions);

const COMPLETE_DELIVERABLE_REVIEW_MUTATION = gql`
  mutation CompleteDeliverable($id: ID!, $finalStatus: FinalDeliverableStatus!) {
    completeDeliverable(id: $id, finalStatus: $finalStatus) {
      id
      status
    }
  }
`;

export const FINAL_STATUS_OPTIONS: Option[] = [
  { label: "Accepted", value: "Accepted" },
  { label: "Approved", value: "Approved" },
  { label: "Received and Filed", value: "Received and Filed" },
];

export interface CompleteReviewDeliverableDialogDeliverable {
  id: string;
}

export interface CompleteReviewFormData {
  finalStatus: FinalDeliverableStatus | "";
}

export const INITIAL_FORM_DATA: CompleteReviewFormData = {
  finalStatus: "",
};

export const formIsValid = (form: CompleteReviewFormData): boolean =>
  form.finalStatus !== "";

export const formHasChanges = (form: CompleteReviewFormData): boolean =>
  form.finalStatus !== "";

export interface CompleteReviewDeliverableDialogProps {
  onClose: () => void;
  deliverable: CompleteReviewDeliverableDialogDeliverable;
}

export const CompleteReviewDeliverableDialog: React.FC<
  CompleteReviewDeliverableDialogProps
> = ({ onClose, deliverable }) => {
  const { showSuccess, showError } = useToast();

  const [completeReviewTrigger] = useMutation(COMPLETE_DELIVERABLE_REVIEW_MUTATION);

  const [formData, setFormData] = useState<CompleteReviewFormData>(INITIAL_FORM_DATA);

  const isValidForm = formIsValid(formData);
  const hasChanges = formHasChanges(formData);

  const handleSubmit = async () => {
    if (!isValidForm || formData.finalStatus === "") return;

    try {
      await completeReviewTrigger({
        variables: {
          id: deliverable.id,
          finalStatus: formData.finalStatus,
        },
        refetchQueries: [
          { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
        ],
        awaitRefetchQueries: true,
      });

      showSuccess(DELIVERABLE_REVIEW_COMPLETED_MESSAGE);
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to complete deliverable review.");
    }
  };

  return (
    <BaseDialog
      name={COMPLETE_REVIEW_DIALOG_NAME}
      title={COMPLETE_REVIEW_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={COMPLETE_REVIEW_SUBMIT_BUTTON_NAME}
          onClick={handleSubmit}
          disabled={!isValidForm}
        >
          Submit
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <Select
          id={COMPLETE_REVIEW_STATUS_FIELD_NAME}
          label="Status"
          isRequired
          options={FINAL_STATUS_OPTIONS}
          value={formData.finalStatus}
          onSelect={(value) =>
            setFormData({ finalStatus: value as FinalDeliverableStatus | "" })
          }
        />
      </div>
    </BaseDialog>
  );
};
