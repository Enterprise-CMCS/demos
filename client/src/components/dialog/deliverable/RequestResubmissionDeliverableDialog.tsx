import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { Textarea } from "components/input/Textarea";
import { useToast } from "components/toast";

import { DeliverableStatus } from "demos-server";
import { formatDateForServer } from "util/formatDate";

import { isBefore, isValid, parseISO } from "date-fns";

export const REQUEST_RESUBMISSION_DIALOG_TITLE = "Request Resubmission";
export const REQUEST_RESUBMISSION_DIALOG_NAME = "request-resubmission-dialog";

export const REQUEST_RESUBMISSION_DATE_FIELD_NAME = "request-resubmission-date";
export const REQUEST_RESUBMISSION_DETAILS_FIELD_NAME = "request-resubmission-details";
export const REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME =
  "button-request-resubmission-submit";

export const RESUBMISSION_REQUESTED_MESSAGE =
  "Resubmission Request was successfully submitted";

const REQUEST_DELIVERABLE_RESUBMISSION_MUTATION = gql`
  mutation RequestDeliverableResubmission(
    $id: ID!
    $input: RequestDeliverableResubmissionInput!
  ) {
    requestDeliverableResubmission(id: $id, input: $input) {
      id
      status
      dueDate
    }
  }
`;

export const RESUBMISSION_ELIGIBLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Past Due",
]);

export const canRequestResubmission = (status: DeliverableStatus): boolean =>
  RESUBMISSION_ELIGIBLE_STATUSES.has(status);

export interface RequestResubmissionDeliverableDialogDeliverable {
  id: string;
  dueDate: Date;
}

export interface RequestResubmissionFormData {
  newDueDate: string;
  details: string;
}

export const INITIAL_FORM_DATA: RequestResubmissionFormData = {
  newDueDate: "",
  details: "",
};

export const getNewDueDateValidationMessage = (
  newDueDate: string,
  currentDueDate: Date
): string => {
  if (newDueDate === "") return "";

  const parsed = parseISO(newDueDate);

  if (!isValid(parsed)) return "Enter a valid date.";

  if (isBefore(parsed, currentDueDate)) {
    return "New Due Date must be greater than or equal to Current Due Date.";
  }

  return "";
};

export const formIsValid = (
  form: RequestResubmissionFormData,
  currentDueDate: Date
): boolean => {
  const newDueDateValid =
    form.newDueDate.trim().length > 0 &&
    getNewDueDateValidationMessage(form.newDueDate, currentDueDate) === "";

  return newDueDateValid && form.details.trim().length > 0;
};

export const formHasChanges = (form: RequestResubmissionFormData): boolean =>
  form.newDueDate.length > 0 || form.details.trim().length > 0;

export interface RequestResubmissionDeliverableDialogProps {
  onClose: () => void;
  deliverable: RequestResubmissionDeliverableDialogDeliverable;
}

export const RequestResubmissionDeliverableDialog: React.FC<
  RequestResubmissionDeliverableDialogProps
> = ({ onClose, deliverable }) => {
  const { showSuccess, showError } = useToast();

  const [requestResubmissionTrigger] = useMutation(REQUEST_DELIVERABLE_RESUBMISSION_MUTATION);

  const [formData, setFormData] =
    useState<RequestResubmissionFormData>(INITIAL_FORM_DATA);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const newDueDateError = getNewDueDateValidationMessage(
    formData.newDueDate,
    deliverable.dueDate
  );

  const isValidForm = formIsValid(formData, deliverable.dueDate);
  const hasChanges = formHasChanges(formData);

  const handleSubmit = async () => {
    setAttemptedSubmit(true);

    if (!isValidForm) return;

    try {
      await requestResubmissionTrigger({
        variables: {
          id: deliverable.id,
          input: {
            newDueDate: formatDateForServer(parseISO(formData.newDueDate)),
            details: formData.details.trim(),
          },
        },
        refetchQueries: ["GetDeliverable"],
        awaitRefetchQueries: true,
      });

      showSuccess("Resubmission Request was successfully submitted");
      onClose();
    } catch (error) {
      console.error(error);
      showError("Unable to submit resubmission request.");
    }
  };

  return (
    <BaseDialog
      name={REQUEST_RESUBMISSION_DIALOG_NAME}
      title={REQUEST_RESUBMISSION_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={REQUEST_RESUBMISSION_SUBMIT_BUTTON_NAME}
          onClick={handleSubmit}
          disabled={!isValidForm}
        >
          Submit
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <DatePicker
          name={REQUEST_RESUBMISSION_DATE_FIELD_NAME}
          label="New Due Date"
          isRequired
          value={formData.newDueDate}
          onChange={(newDueDate) =>
            setFormData((prev) => ({ ...prev, newDueDate }))
          }
          getValidationMessage={() =>
            attemptedSubmit && formData.newDueDate === ""
              ? "New Due Date is required."
              : newDueDateError
          }
        />

        <Textarea
          name={REQUEST_RESUBMISSION_DETAILS_FIELD_NAME}
          label="Reason Details"
          isRequired
          value={formData.details}
          placeholder="Enter"
          onChange={(details) =>
            setFormData((prev) => ({ ...prev, details }))
          }
          getValidationMessage={(value) =>
            attemptedSubmit && value.trim() === ""
              ? "Reason Details is required."
              : ""
          }
        />
      </div>
    </BaseDialog>
  );
};
