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
import { DELIVERABLE_RENEWAL_REVIEW_SUBMITTED_MESSAGE } from "util/messages";

export const APPROVE_DELIVERABLE_RENEWAL_MUTATION = gql`
  mutation ApproveDeliverableRenewal(
    $deliverableId: ID!
    $input: ApproveDeliverableExtensionInput!
  ) {
    approveDeliverableRenewal: approveDeliverableExtension(
      deliverableId: $deliverableId
      input: $input
    ) {
      id
      status
      dueDate
    }
  }
`;

export const DENY_DELIVERABLE_RENEWAL_MUTATION = gql`
  mutation DenyDeliverableRenewal($deliverableId: ID!, $input: DenyDeliverableExtensionInput!) {
    denyDeliverableRenewal: denyDeliverableExtension(deliverableId: $deliverableId, input: $input) {
      id
      status
      dueDate
    }
  }
`;

export const REVIEW_RENEWAL_DIALOG_TITLE = "Review Renewal Request";
export const REVIEW_RENEWAL_DIALOG_NAME = "review-renewal-dialog";
export const REVIEW_RENEWAL_STATUS_FIELD_NAME = "review-renewal-status";
export const REVIEW_RENEWAL_NEW_DATE_FIELD_NAME = "review-renewal-new-date";
export const REVIEW_RENEWAL_DETAILS_FIELD_NAME = "review-renewal-details";
export const REVIEW_RENEWAL_SUBMIT_BUTTON_NAME = "button-review-renewal-submit";
export const REVIEW_RENEWAL_EXPIRED_NOTICE_NAME = "review-renewal-expired-notice";

export const STATE_REQUESTED_DATE_EXPIRED_MESSAGE =
  "State Requested Date has expired and cannot be approved as is";

export type ReviewRenewalDecision = "Approved" | "Approve With New Date" | "Denied";

export const REVIEW_RENEWAL_OPTIONS: Option[] = [
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

export interface ReviewRenewalDeliverableDialogDeliverable {
  id: string;
  renewalRequest: {
    id: string;
    reasonCode: DeliverableExtensionReasonCode;
    reasonDetails: string;
    initialDueDateAtRequest: Date;
    originalDateRequested: Date;
  };
}

export interface ReviewRenewalFormData {
  decision: ReviewRenewalDecision | "";
  newDate: string;
  denialDetails: string;
}

export const INITIAL_FORM_DATA: ReviewRenewalFormData = {
  decision: "",
  newDate: "",
  denialDetails: "",
};

export const formHasChanges = (form: ReviewRenewalFormData): boolean =>
  form.decision !== "" || form.newDate.length > 0 || form.denialDetails.trim().length > 0;

export const formIsValid = (
  form: ReviewRenewalFormData,
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

export interface ReviewRenewalDeliverableDialogProps {
  onClose: () => void;
  deliverable: ReviewRenewalDeliverableDialogDeliverable;
}

export const ReviewRenewalDeliverableDialog: React.FC<ReviewRenewalDeliverableDialogProps> = ({
  onClose,
  deliverable,
}) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<ReviewRenewalFormData>(INITIAL_FORM_DATA);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [approveRenewalTrigger] = useMutation(APPROVE_DELIVERABLE_RENEWAL_MUTATION);
  const [denyRenewalTrigger] = useMutation(DENY_DELIVERABLE_RENEWAL_MUTATION);

  const { renewalRequest } = deliverable;
  const expired = isStateRequestedDateExpired(renewalRequest.originalDateRequested);
  const newDateError = getNewDateValidationMessage(formData.newDate);
  const isValidForm = formIsValid(formData, expired);
  const hasChanges = formHasChanges(formData);

  const requestedDateDisplay = expired
    ? `${formatDateForDisplay(renewalRequest.originalDateRequested)} (Expired)`
    : formatDateForDisplay(renewalRequest.originalDateRequested);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!isValidForm) return;

    const refetchQueries = [
      { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
    ];

    try {
      if (formData.decision === "Denied") {
        await denyRenewalTrigger({
          variables: {
            deliverableId: deliverable.id,
            input: {
              deliverableExtensionId: renewalRequest.id,
              details: formData.denialDetails.trim(),
            },
          },
          refetchQueries,
          awaitRefetchQueries: true,
        });
      } else {
        const input: { deliverableExtensionId: string; newDueDate?: string } = {
          deliverableExtensionId: renewalRequest.id,
        };
        if (formData.decision === "Approve With New Date") {
          input.newDueDate = formatDateForServer(parseISO(formData.newDate));
        }
        await approveRenewalTrigger({
          variables: { deliverableId: deliverable.id, input },
          refetchQueries,
          awaitRefetchQueries: true,
        });
      }

      showSuccess(DELIVERABLE_RENEWAL_REVIEW_SUBMITTED_MESSAGE);
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to submit renewal review.");
    }
  };

  return (
    <BaseDialog
      name={REVIEW_RENEWAL_DIALOG_NAME}
      title={REVIEW_RENEWAL_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={REVIEW_RENEWAL_SUBMIT_BUTTON_NAME}
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
            value={formatDateForDisplay(renewalRequest.initialDueDateAtRequest)}
          />
          <Field label="State Requested New Date" value={requestedDateDisplay} />
          <div className="col-span-2">
            <Field label="Requested Reason" value={renewalRequest.reasonCode} />
          </div>
          <div className="col-span-2">
            <Field label="Requested Details" value={renewalRequest.reasonDetails} />
          </div>
        </div>

        {expired && (
          <div data-testid={REVIEW_RENEWAL_EXPIRED_NOTICE_NAME}>
            <Notice title={STATE_REQUESTED_DATE_EXPIRED_MESSAGE} variant="error" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-sm items-start">
          <Select
            id={REVIEW_RENEWAL_STATUS_FIELD_NAME}
            label="Request Status"
            isRequired
            options={REVIEW_RENEWAL_OPTIONS}
            value={formData.decision}
            onSelect={(value) =>
              setFormData((prev) => ({
                ...prev,
                decision: value as ReviewRenewalDecision | "",
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
              name={REVIEW_RENEWAL_NEW_DATE_FIELD_NAME}
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
            name={REVIEW_RENEWAL_DETAILS_FIELD_NAME}
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
