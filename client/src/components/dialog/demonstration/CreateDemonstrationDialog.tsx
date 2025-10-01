import React from "react";
import { useToast } from "components/toast";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { useMutation } from "@apollo/client";
import { CreateDemonstrationInput } from "demos-server";
import { gql } from "@apollo/client";

const DEFAULT_DEMONSTRATION_DIALOG_FIELDS: DemonstrationDialogFields = {
  name: "",
  effectiveDate: "",
  expirationDate: "",
  description: "",
  stateId: "",
  projectOfficerId: "",
};

const SUCCESS_MESSAGE = "Demonstration created successfully!";
const ERROR_MESSAGE = "Failed to create demonstration. Please try again.";

export const CREATE_DEMONSTRATION_MUTATION = gql`
  mutation CreateDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      success
      message
    }
  }
`;
export const CreateDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToast();

  const [createDemonstrationTrigger] = useMutation(CREATE_DEMONSTRATION_MUTATION);

  const getCreateDemonstrationInput = (
    demonstration: DemonstrationDialogFields
  ): CreateDemonstrationInput => ({
    name: demonstration.name,
    description: demonstration.description,
    stateId: demonstration.stateId,
    projectOfficerUserId: demonstration.projectOfficerId,
    cmcsDivision: demonstration.cmcsDivision,
    signatureLevel: demonstration.signatureLevel,
  });

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      const result = await createDemonstrationTrigger({
        variables: {
          input: getCreateDemonstrationInput(demonstration),
        },
      });

      const success = result.data?.createDemonstration?.success || false;
      onClose();
      if (success) {
        showSuccess(SUCCESS_MESSAGE);
      } else {
        console.error(result.data?.createDemonstration?.message);
        showError(
          "Create a demonstration failed - please check the console for the error message."
        );
      }
    } catch {
      showError(ERROR_MESSAGE);
    }
  };

  return (
    <DemonstrationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      initialDemonstration={DEFAULT_DEMONSTRATION_DIALOG_FIELDS}
      onSubmit={onSubmit}
    />
  );
};
