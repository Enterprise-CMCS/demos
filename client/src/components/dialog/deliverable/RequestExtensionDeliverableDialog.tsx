import React, { useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { Select, Option } from "components/input/select/Select";
import { Textarea } from "components/input/Textarea";
import { useToast } from "components/toast";
import { DeliverableExtensionReasonCode, DeliverableStatus } from "demos-server";
import { DELIVERABLE_EXTENSION_REASON_CODES } from "demos-server-constants";
import { isAfter, isValid, parseISO } from "date-fns";
import { DELIVERABLE_EXTENSION_REQUESTED_MESSAGE } from "util/messages";

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

export const canRequestExtension = (status: DeliverableStatus): boolean =>
  EXTENSION_ELIGIBLE_STATUSES.has(status);

export const REQUEST_REASON_OPTIONS: Option[] = DELIVERABLE_EXTENSION_REASON_CODES.map((code) => ({
  label: code,
  value: code,
}));

export interface RequestExtensionDeliverableDialogDeliverable {
  id: string;
  dueDate: Date;
  demonstration: { expirationDate?: Date | null };
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
  dueDate: Date,
  demonstrationExpirationDate: Date | null | undefined
): string => {
  if (extensionDate === "") return "";
  const parsed = parseISO(extensionDate);
  if (!isValid(parsed)) return "Enter a valid date.";
  if (!isAfter(parsed, dueDate)) {
    return "Extension Date must be after the current Due Date.";
  }
  if (demonstrationExpirationDate && isAfter(parsed, demonstrationExpirationDate)) {
    return "Extension Date cannot be after the Demonstration Expiration Date.";
  }
  return "";
};

export const formIsValid = (
  form: RequestExtensionFormData,
  dueDate: Date,
  demonstrationExpirationDate: Date | null | undefined
): boolean => {
  const extensionDateValid =
    form.extensionDate.trim().length > 0 &&
    getExtensionDateValidationMessage(form.extensionDate, dueDate, demonstrationExpirationDate) ===
      "";
  return extensionDateValid && form.requestReason.length > 0 && form.details.trim().length > 0;
};

export const formHasChanges = (form: RequestExtensionFormData): boolean =>
  form.extensionDate.length > 0 || form.requestReason.length > 0 || form.details.trim().length > 0;

export interface RequestExtensionDeliverableDialogProps {
  onClose: () => void;
  deliverable: RequestExtensionDeliverableDialogDeliverable;
  onSubmit?: (input: {
    deliverableId: string;
    extensionDate: string;
    requestReason: DeliverableExtensionReasonCode;
    details: string;
  }) => Promise<void> | void;
}

export const RequestExtensionDeliverableDialog: React.FC<
  RequestExtensionDeliverableDialogProps
> = ({ onClose, deliverable, onSubmit }) => {
  const { showSuccess } = useToast();

  const [formData, setFormData] = useState<RequestExtensionFormData>(INITIAL_FORM_DATA);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const expirationDate = deliverable.demonstration.expirationDate ?? null;
  const extensionDateError = getExtensionDateValidationMessage(
    formData.extensionDate,
    deliverable.dueDate,
    expirationDate
  );
  const isValidForm = formIsValid(formData, deliverable.dueDate, expirationDate);
  const hasChanges = formHasChanges(formData);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!isValidForm || formData.requestReason === "") return;

    await onSubmit?.({
      deliverableId: deliverable.id,
      extensionDate: formData.extensionDate,
      requestReason: formData.requestReason,
      details: formData.details.trim(),
    });

    showSuccess(DELIVERABLE_EXTENSION_REQUESTED_MESSAGE);
    onClose();
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
