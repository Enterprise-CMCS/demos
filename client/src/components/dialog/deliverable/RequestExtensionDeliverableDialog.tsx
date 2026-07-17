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
import { DELIVERABLE_EXTENSION_REQUESTED_MESSAGE } from "util/messages";

export const REQUEST_DELIVERABLE_EXTENSION_MUTATION = gql`
  mutation RequestDeliverableExtension(
    $deliverableId: ID!
    $input: RequestDeliverableExtensionInput!
  ) {
    requestDeliverableExtension(deliverableId: $deliverableId, input: $input) {
      id
      status
      dueDate
    }
  }
`;

export const REQUEST_EXTENSION_DIALOG_TITLE = "Request Extension";
export const REQUEST_EXTENSION_DIALOG_NAME = "request-extension-dialog";
export const REQUEST_EXTENSION_DATE_FIELD_NAME = "request-extension-date";
export const REQUEST_EXTENSION_REASON_FIELD_NAME = "request-extension-reason";
export const REQUEST_EXTENSION_DETAILS_FIELD_NAME = "request-extension-details";
export const REQUEST_EXTENSION_SUBMIT_BUTTON_NAME = "button-request-extension-submit";

export const EXTENSION_ELIGIBLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Upcoming",
  "Past Due",
]);

export const hasOpenExtensionRequest = (
  extensions: { status: DeliverableExtensionStatus }[]
): boolean => extensions.some((extension) => extension.status === "Requested");

export const canRequestExtension = (
  status: DeliverableStatus,
  extensions: { status: DeliverableExtensionStatus }[]
): boolean => EXTENSION_ELIGIBLE_STATUSES.has(status) && !hasOpenExtensionRequest(extensions);

export const REQUEST_REASON_OPTIONS: Option[] = DELIVERABLE_EXTENSION_REASON_CODES.map((code) => ({
  label: code,
  value: code,
}));

export interface RequestExtensionDeliverableDialogDeliverable {
  id: string;
  dueDate: Date;
}

export interface RequestExtensionFormData {
  extensionDate: string;
  requestReason: DeliverableExtensionReasonCode | "";
  details: string;
}

export const INITIAL_FORM_DATA: RequestExtensionFormData = {
  extensionDate: "",
  requestReason: "",
  details: "",
};

export const getExtensionDateValidationMessage = (
  extensionDate: string,
  dueDate: Date
): string => {
  if (extensionDate === "") return "";
  const parsed = parseISO(extensionDate);
  if (!isValid(parsed)) return "Enter a valid date.";
  if (!isAfter(parsed, dueDate)) {
    return "Extension Date must be after the current Due Date.";
  }
  return "";
};

export const formIsValid = (form: RequestExtensionFormData, dueDate: Date): boolean => {
  const extensionDateValid =
    form.extensionDate.trim().length > 0 &&
    getExtensionDateValidationMessage(form.extensionDate, dueDate) === "";
  return extensionDateValid && form.requestReason.length > 0 && form.details.trim().length > 0;
};

export const formHasChanges = (form: RequestExtensionFormData): boolean =>
  form.extensionDate.length > 0 || form.requestReason.length > 0 || form.details.trim().length > 0;

export interface RequestExtensionDeliverableDialogProps {
  onClose: () => void;
  deliverable: RequestExtensionDeliverableDialogDeliverable;
}

export const RequestExtensionDeliverableDialog: React.FC<
  RequestExtensionDeliverableDialogProps
> = ({ onClose, deliverable }) => {
  const { showSuccess, showError } = useToast();

  const [requestExtensionTrigger] = useMutation(REQUEST_DELIVERABLE_EXTENSION_MUTATION);

  const [formData, setFormData] = useState<RequestExtensionFormData>(INITIAL_FORM_DATA);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const extensionDateError = getExtensionDateValidationMessage(
    formData.extensionDate,
    deliverable.dueDate
  );
  const isValidForm = formIsValid(formData, deliverable.dueDate);
  const hasChanges = formHasChanges(formData);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!isValidForm || formData.requestReason === "") return;

    try {
      await requestExtensionTrigger({
        variables: {
          deliverableId: deliverable.id,
          input: {
            reason: formData.requestReason,
            details: formData.details.trim(),
            requestedDueDate: formatDateForServer(parseISO(formData.extensionDate)),
          },
        },
        refetchQueries: [
          { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
        ],
        awaitRefetchQueries: true,
      });

      showSuccess(DELIVERABLE_EXTENSION_REQUESTED_MESSAGE);
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to submit extension request.");
    }
  };

  return (
    <BaseDialog
      name={REQUEST_EXTENSION_DIALOG_NAME}
      title={REQUEST_EXTENSION_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={REQUEST_EXTENSION_SUBMIT_BUTTON_NAME}
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
            name={REQUEST_EXTENSION_DATE_FIELD_NAME}
            label="Extension Date"
            isRequired
            value={formData.extensionDate}
            onChange={(extensionDate) => setFormData((prev) => ({ ...prev, extensionDate }))}
            getValidationMessage={() =>
              attemptedSubmit && formData.extensionDate === ""
                ? "Extension Date is required."
                : extensionDateError
            }
          />
          <Select
            id={REQUEST_EXTENSION_REASON_FIELD_NAME}
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
          name={REQUEST_EXTENSION_DETAILS_FIELD_NAME}
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
