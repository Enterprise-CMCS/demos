import React, { useState } from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";
import { useDialog } from "../../DialogContext";
import { useCreateDemonstration } from "./useCreateDemonstration";
import {
  CreateDemonstrationForm,
  CreateDemonstrationFormData,
  SUBMIT_BUTTON_NAME,
} from "./CreateDemonstrationForm";
import { CreateDemonstrationInput } from "demos-server";

export const getCreateDemonstrationInput = (
  demonstration: CreateDemonstrationFormData
): CreateDemonstrationInput => ({
  name: demonstration.name,
  description: demonstration.description,
  stateId: demonstration.stateId,
  sdgDivision: demonstration.sdgDivision,
  projectOfficerUserId: demonstration.projectOfficerUserId,
});

export const checkFormHasChanges = (
  initialDemonstration: CreateDemonstrationFormData,
  demonstration: CreateDemonstrationFormData
) => {
  return !!(
    demonstration.name ||
    demonstration.description ||
    demonstration.stateId ||
    demonstration.sdgDivision ||
    demonstration.projectOfficerUserId !== initialDemonstration.projectOfficerUserId
  );
};

export const checkFormIsValid = (demonstration: CreateDemonstrationFormData) => {
  return demonstration.name && demonstration.stateId && demonstration.projectOfficerUserId;
};

export const CreateDemonstrationDialogContent = ({
  initialDemonstration,
}: {
  initialDemonstration: CreateDemonstrationFormData;
}) => {
  const { closeDialog } = useDialog();
  const { onSubmit, saving } = useCreateDemonstration({ onSuccess: closeDialog });
  const [demonstration, setDemonstration] =
    useState<CreateDemonstrationFormData>(initialDemonstration);

  const hasChanges = checkFormHasChanges(initialDemonstration, demonstration);
  const formIsValid = checkFormIsValid(demonstration);

  return (
    <BaseDialog
      title={"New Demonstration"}
      onClose={closeDialog}
      maxWidthClass="max-w-[920px]"
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={SUBMIT_BUTTON_NAME}
          onClick={() => onSubmit(getCreateDemonstrationInput(demonstration))}
          aria-label={"Create New Demonstration"}
          disabled={!hasChanges || !formIsValid || saving}
        >
          {saving && <Spinner />}
          {saving ? "Loading" : "Submit"}
        </Button>
      }
    >
      <CreateDemonstrationForm demonstration={demonstration} setDemonstration={setDemonstration} />
    </BaseDialog>
  );
};
