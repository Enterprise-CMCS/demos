import React, { useState } from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";
import { useDialog } from "../../DialogContext";
import { useUpdateDemonstration } from "./useUpdateDemonstration";
import {
  EditDemonstrationForm,
  EditDemonstrationFormData,
  getUpdateDemonstrationInput,
  SUBMIT_BUTTON_NAME,
} from "./EditDemonstrationForm";
import { isBefore } from "date-fns";

export const checkFormHasChanges = (
  initialDemonstration: EditDemonstrationFormData,
  demonstration: EditDemonstrationFormData
) => {
  return !!(
    demonstration.name !== initialDemonstration.name ||
    demonstration.description !== initialDemonstration.description ||
    demonstration.stateId !== initialDemonstration.stateId ||
    demonstration.sdgDivision !== initialDemonstration.sdgDivision ||
    demonstration.projectOfficerUserId !== initialDemonstration.projectOfficerUserId ||
    demonstration.effectiveDate !== initialDemonstration.effectiveDate ||
    demonstration.expirationDate !== initialDemonstration.expirationDate ||
    demonstration.signatureLevel !== initialDemonstration.signatureLevel
  );
};

export const checkFormIsValid = (demonstration: EditDemonstrationFormData, isApproved: boolean) => {
  const hasRequiredFields =
    demonstration.name && demonstration.stateId && demonstration.projectOfficerUserId;

  const hasRequiredApprovedFields =
    !isApproved ||
    (demonstration.effectiveDate && demonstration.expirationDate && demonstration.sdgDivision);

  const hasInvalidDateRange =
    demonstration.expirationDate &&
    demonstration.effectiveDate &&
    isBefore(demonstration.expirationDate, demonstration.effectiveDate);

  return !!(hasRequiredFields && hasRequiredApprovedFields && !hasInvalidDateRange);
};

export const EditDemonstrationDialogContent = ({
  demonstrationId,
  initialDemonstration,
  isApproved,
}: {
  demonstrationId: string;
  initialDemonstration: EditDemonstrationFormData;
  isApproved: boolean;
}) => {
  const { closeDialog } = useDialog();
  const { onSubmit, saving } = useUpdateDemonstration({ onSuccess: closeDialog });

  const [demonstration, setDemonstration] =
    useState<EditDemonstrationFormData>(initialDemonstration);

  const hasChanges = checkFormHasChanges(initialDemonstration, demonstration);
  const formIsValid = checkFormIsValid(demonstration, isApproved);

  return (
    <BaseDialog
      title={"Edit Demonstration"}
      onClose={closeDialog}
      maxWidthClass="max-w-[920px]"
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={SUBMIT_BUTTON_NAME}
          onClick={() => onSubmit(demonstrationId, getUpdateDemonstrationInput(demonstration))}
          aria-label={"Edit Demonstration"}
          disabled={!hasChanges || !formIsValid || saving}
        >
          {saving && <Spinner />}
          {saving ? "Loading" : "Submit"}
        </Button>
      }
    >
      <EditDemonstrationForm
        demonstration={demonstration}
        setDemonstration={setDemonstration}
        isApproved={isApproved}
      />
    </BaseDialog>
  );
};
