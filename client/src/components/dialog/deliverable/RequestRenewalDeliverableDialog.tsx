import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { Select, Option } from "components/input/select/Select";
import { Textarea } from "components/input/Textarea";
import { useToast } from "components/toast";
import {
  DeliverableExtensionReasonCode,
  DeliverableExtensionStatus,
  DeliverableStatus,
} from "demos-server";
import { DELIVERABLE_EXTENSION_REASON_CODES } from "demos-server-constants";
import { isAfter, isValid, parseISO } from "date-fns";
import { DELIVERABLE_DETAILS_QUERY } from "pages/deliverables/DeliverableDetailsManagementPage";
import { formatDateForServer } from "util/formatDate";
import { DELIVERABLE_RENEWAL_REQUESTED_MESSAGE } from "util/messages";

export const REQUEST_DELIVERABLE_RENEWAL_MUTATION = gql`
  mutation RequestDeliverableRenewal(
    $deliverableId: ID!
    $input: RequestDeliverableExtensionInput!
  ) {
    requestDeliverableRenewal: requestDeliverableExtension(
      deliverableId: $deliverableId
      input: $input
    ) {
      id
      status
      dueDate
    }
  }
`;

export const REQUEST_RENEWAL_DIALOG_TITLE = "Request Renewal";
export const REQUEST_RENEWAL_DIALOG_NAME = "request-renewal-dialog";
export const REQUEST_RENEWAL_DATE_FIELD_NAME = "request-renewal-date";
export const REQUEST_RENEWAL_REASON_FIELD_NAME = "request-renewal-reason";
export const REQUEST_RENEWAL_DETAILS_FIELD_NAME = "request-renewal-details";
export const REQUEST_RENEWAL_SUBMIT_BUTTON_NAME = "button-request-renewal-submit";

export const RENEWAL_ELIGIBLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Upcoming",
  "Past Due",
]);

export const hasOpenRenewalRequest = (
  renewals: { status: DeliverableExtensionStatus }[]
): boolean => renewals.some((renewal) => renewal.status === "Requested");

export const canRequestRenewal = (
  status: DeliverableStatus,
  renewals: { status: DeliverableExtensionStatus }[]
): boolean => RENEWAL_ELIGIBLE_STATUSES.has(status) && !hasOpenRenewalRequest(renewals);

export const REQUEST_REASON_OPTIONS: Option[] = DELIVERABLE_EXTENSION_REASON_CODES.map((code) => ({
  label: code,
  value: code,
}));

export interface RequestRenewalDeliverableDialogDeliverable {
  id: string;
  dueDate: Date;
}

export interface RequestRenewalFormData {
  renewalDate: string;
  requestReason: DeliverableExtensionReasonCode | "";
  details: string;
}

export const INITIAL_FORM_DATA: RequestRenewalFormData = {
  renewalDate: "",
  requestReason: "",
  details: "",
};

export const getRenewalDateValidationMessage = (renewalDate: string, dueDate: Date): string => {
  if (renewalDate === "") return "";
  const parsed = parseISO(renewalDate);
  if (!isValid(parsed)) return "Enter a valid date.";
  if (!isAfter(parsed, dueDate)) {
    return "Renewal Date must be after the current Due Date.";
  }
  return "";
};

export const formIsValid = (form: RequestRenewalFormData, dueDate: Date): boolean => {
  const renewalDateValid =
    form.renewalDate.trim().length > 0 &&
    getRenewalDateValidationMessage(form.renewalDate, dueDate) === "";
  return renewalDateValid && form.requestReason.length > 0 && form.details.trim().length > 0;
};

export const formHasChanges = (form: RequestRenewalFormData): boolean =>
  form.renewalDate.length > 0 || form.requestReason.length > 0 || form.details.trim().length > 0;

export interface RequestRenewalDeliverableDialogProps {
  onClose: () => void;
  deliverable: RequestRenewalDeliverableDialogDeliverable;
}

export const RequestRenewalDeliverableDialog: React.FC<RequestRenewalDeliverableDialogProps> = ({
  onClose,
  deliverable,
}) => {
  const { showSuccess, showError } = useToast();

  const [requestRenewalTrigger] = useMutation(REQUEST_DELIVERABLE_RENEWAL_MUTATION);

  const [formData, setFormData] = useState<RequestRenewalFormData>(INITIAL_FORM_DATA);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const renewalDateError = getRenewalDateValidationMessage(
    formData.renewalDate,
    deliverable.dueDate
  );
  const isValidForm = formIsValid(formData, deliverable.dueDate);
  const hasChanges = formHasChanges(formData);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!isValidForm || formData.requestReason === "") return;

    try {
      await requestRenewalTrigger({
        variables: {
          deliverableId: deliverable.id,
          input: {
            reason: formData.requestReason,
            details: formData.details.trim(),
            requestedDueDate: formatDateForServer(parseISO(formData.renewalDate)),
          },
        },
        refetchQueries: [{ query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } }],
        awaitRefetchQueries: true,
      });

      showSuccess(DELIVERABLE_RENEWAL_REQUESTED_MESSAGE);
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to submit renewal request.");
    }
  };

  return (
    <BaseDialog
      name={REQUEST_RENEWAL_DIALOG_NAME}
      title={REQUEST_RENEWAL_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={REQUEST_RENEWAL_SUBMIT_BUTTON_NAME}
          onClick={handleSubmit}
          disabled={!isValidForm}
        >
          Submit
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="grid grid-cols-2 gap-sm">
          <DatePicker
            name={REQUEST_RENEWAL_DATE_FIELD_NAME}
            label="Renewal Date"
            isRequired
            value={formData.renewalDate}
            onChange={(renewalDate) => setFormData((prev) => ({ ...prev, renewalDate }))}
            getValidationMessage={() =>
              attemptedSubmit && formData.renewalDate === ""
                ? "Renewal Date is required."
                : renewalDateError
            }
          />
          <Select
            id={REQUEST_RENEWAL_REASON_FIELD_NAME}
            label="Request Reason"
            isRequired
            options={REQUEST_REASON_OPTIONS}
            value={formData.requestReason}
            onSelect={(value) =>
              setFormData((prev) => ({
                ...prev,
                requestReason: value as DeliverableExtensionReasonCode | "",
              }))
            }
            validationMessage={
              attemptedSubmit && formData.requestReason === "" ? "Request Reason is required." : ""
            }
          />
        </div>
        <Textarea
          name={REQUEST_RENEWAL_DETAILS_FIELD_NAME}
          label="Details"
          isRequired
          value={formData.details}
          placeholder="Enter"
          onChange={(value) => setFormData((prev) => ({ ...prev, details: value }))}
          getValidationMessage={(value) =>
            attemptedSubmit && value.trim() === "" ? "Details is required." : ""
          }
        />
      </div>
    </BaseDialog>
  );
};
