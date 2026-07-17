import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { isAfter, isValid, parseISO, startOfToday } from "date-fns";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { Select, Option } from "components/input/select/Select";
import { Textarea } from "components/input/Textarea";
import { Notice } from "components/notice/Notice";
import { useToast } from "components/toast";
import { DeliverableExtensionReasonCode } from "demos-server";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { formatDateForDisplay, formatDateForServer } from "util/formatDate";
import { DELIVERABLE_EXTENSION_REVIEW_SUBMITTED_MESSAGE } from "util/messages";

export const APPROVE_DELIVERABLE_EXTENSION_MUTATION = gql`
  mutation ApproveDeliverableExtension(
    $deliverableId: ID!
    $input: ApproveDeliverableExtensionInput!
  ) {
    approveDeliverableExtension(deliverableId: $deliverableId, input: $input) {
      id
      status
      dueDate
    }
  }
`;

export const DENY_DELIVERABLE_EXTENSION_MUTATION = gql`
  mutation DenyDeliverableExtension($deliverableId: ID!, $input: DenyDeliverableExtensionInput!) {
    denyDeliverableExtension(deliverableId: $deliverableId, input: $input) {
      id
      status
      dueDate
    }
  }
`;

export const REVIEW_EXTENSION_DIALOG_TITLE = "Review Extension Request";
export const REVIEW_EXTENSION_DIALOG_NAME = "review-extension-dialog";
export const REVIEW_EXTENSION_STATUS_FIELD_NAME = "review-extension-status";
export const REVIEW_EXTENSION_NEW_DATE_FIELD_NAME = "review-extension-new-date";
export const REVIEW_EXTENSION_DETAILS_FIELD_NAME = "review-extension-details";
export const REVIEW_EXTENSION_SUBMIT_BUTTON_NAME = "button-review-extension-submit";
export const REVIEW_EXTENSION_EXPIRED_NOTICE_NAME = "review-extension-expired-notice";

export const STATE_REQUESTED_DATE_EXPIRED_MESSAGE =
  "State Requested Date has expired and cannot be approved as is";

export type ReviewExtensionDecision = "Approved" | "Approve With New Date" | "Denied";

export const REVIEW_EXTENSION_OPTIONS: Option[] = [
  { label: "Approved", value: "Approved" },
  { label: "Approve With New Date", value: "Approve With New Date" },
  { label: "Denied", value: "Denied" },
];

export const isStateRequestedDateExpired = (originalDateRequested: Date): boolean =>
  !isAfter(originalDateRequested, startOfToday());

export const getNewDateValidationMessage = (newDate: string): string => {
  if (newDate === "") return "";
  const parsed = parseISO(newDate);
  if (!isValid(parsed)) return "Enter a valid date.";
  if (!isAfter(parsed, startOfToday())) {
    return "New Date must be after today.";
  }
  return "";
};

export interface ReviewExtensionDeliverableDialogDeliverable {
  id: string;
  extensionRequest: {
    id: string;
    reasonCode: DeliverableExtensionReasonCode;
    reasonDetails: string;
    initialDueDateAtRequest: Date;
    originalDateRequested: Date;
  };
}

export interface ReviewExtensionFormData {
  decision: ReviewExtensionDecision | "";
  newDate: string;
  denialDetails: string;
}

export const INITIAL_FORM_DATA: ReviewExtensionFormData = {
  decision: "",
  newDate: "",
  denialDetails: "",
};

export const formHasChanges = (form: ReviewExtensionFormData): boolean =>
  form.decision !== "" || form.newDate.length > 0 || form.denialDetails.trim().length > 0;

export const formIsValid = (
  form: ReviewExtensionFormData,
  stateRequestedDateExpired: boolean
): boolean => {
  if (form.decision === "") return false;
  if (form.decision === "Approved") {
    return !stateRequestedDateExpired;
  }
  if (form.decision === "Approve With New Date") {
    return form.newDate.length > 0 && getNewDateValidationMessage(form.newDate) === "";
  }
  return form.denialDetails.trim().length > 0;
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-xs">
    <span className="text-[14px] font-bold text-text-font">{label}</span>
    <span className="text-[14px] text-text-font">{value}</span>
  </div>
);

export interface ReviewExtensionDeliverableDialogProps {
  onClose: () => void;
  deliverable: ReviewExtensionDeliverableDialogDeliverable;
}

export const ReviewExtensionDeliverableDialog: React.FC<ReviewExtensionDeliverableDialogProps> = ({
  onClose,
  deliverable,
}) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<ReviewExtensionFormData>(INITIAL_FORM_DATA);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [approveExtensionTrigger] = useMutation(APPROVE_DELIVERABLE_EXTENSION_MUTATION);
  const [denyExtensionTrigger] = useMutation(DENY_DELIVERABLE_EXTENSION_MUTATION);

  const { extensionRequest } = deliverable;
  const expired = isStateRequestedDateExpired(extensionRequest.originalDateRequested);
  const newDateError = getNewDateValidationMessage(formData.newDate);
  const isValidForm = formIsValid(formData, expired);
  const hasChanges = formHasChanges(formData);

  const requestedDateDisplay = expired
    ? `${formatDateForDisplay(extensionRequest.originalDateRequested)} (Expired)`
    : formatDateForDisplay(extensionRequest.originalDateRequested);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!isValidForm) return;

    const refetchQueries = [
      { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
    ];

    try {
      if (formData.decision === "Denied") {
        await denyExtensionTrigger({
          variables: {
            deliverableId: deliverable.id,
            input: {
              deliverableExtensionId: extensionRequest.id,
              details: formData.denialDetails.trim(),
            },
          },
          refetchQueries,
          awaitRefetchQueries: true,
        });
      } else {
        const input: { deliverableExtensionId: string; newDueDate?: string } = {
          deliverableExtensionId: extensionRequest.id,
        };
        if (formData.decision === "Approve With New Date") {
          input.newDueDate = formatDateForServer(parseISO(formData.newDate));
        }
        await approveExtensionTrigger({
          variables: { deliverableId: deliverable.id, input },
          refetchQueries,
          awaitRefetchQueries: true,
        });
      }

      showSuccess(DELIVERABLE_EXTENSION_REVIEW_SUBMITTED_MESSAGE);
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to submit extension review.");
    }
  };

  return (
    <BaseDialog
      name={REVIEW_EXTENSION_DIALOG_NAME}
      title={REVIEW_EXTENSION_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={REVIEW_EXTENSION_SUBMIT_BUTTON_NAME}
          onClick={handleSubmit}
          disabled={!isValidForm}
        >
          Submit
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="bg-surface-secondary p-sm rounded grid grid-cols-2 gap-sm">
          <Field
            label="Initial Due Date"
            value={formatDateForDisplay(extensionRequest.initialDueDateAtRequest)}
          />
          <Field label="State Requested New Date" value={requestedDateDisplay} />
          <div className="col-span-2">
            <Field label="Requested Reason" value={extensionRequest.reasonCode} />
          </div>
          <div className="col-span-2">
            <Field label="Requested Details" value={extensionRequest.reasonDetails} />
          </div>
        </div>

        {expired && (
          <div data-testid={REVIEW_EXTENSION_EXPIRED_NOTICE_NAME}>
            <Notice title={STATE_REQUESTED_DATE_EXPIRED_MESSAGE} variant="error" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-sm items-start">
          <Select
            id={REVIEW_EXTENSION_STATUS_FIELD_NAME}
            label="Request Status"
            isRequired
            options={REVIEW_EXTENSION_OPTIONS}
            value={formData.decision}
            onSelect={(value) =>
              setFormData((prev) => ({
                ...prev,
                decision: value as ReviewExtensionDecision | "",
                newDate: value === "Approve With New Date" ? prev.newDate : "",
                denialDetails: value === "Denied" ? prev.denialDetails : "",
              }))
            }
            validationMessage={
              attemptedSubmit && formData.decision === "" ? "Request Status is required." : ""
            }
          />
          {formData.decision === "Approve With New Date" && (
            <DatePicker
              name={REVIEW_EXTENSION_NEW_DATE_FIELD_NAME}
              label="New Date"
              isRequired
              value={formData.newDate}
              onChange={(newDate) => setFormData((prev) => ({ ...prev, newDate }))}
              getValidationMessage={() =>
                attemptedSubmit && formData.newDate === "" ? "New Date is required." : newDateError
              }
            />
          )}
        </div>

        {formData.decision === "Denied" && (
          <Textarea
            name={REVIEW_EXTENSION_DETAILS_FIELD_NAME}
            label="Details"
            isRequired
            value={formData.denialDetails}
            placeholder="Enter"
            onChange={(value) => setFormData((prev) => ({ ...prev, denialDetails: value }))}
            getValidationMessage={(value) =>
              attemptedSubmit && value.trim() === "" ? "Details is required." : ""
            }
          />
        )}
      </div>
    </BaseDialog>
  );
};
