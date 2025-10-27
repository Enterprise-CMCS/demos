import React from "react";
import { useToast } from "components/toast";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { useMutation } from "@apollo/client";
import { CreateDemonstrationInput, Demonstration } from "demos-server";
import { gql } from "@apollo/client";

const DEFAULT_DEMONSTRATION_DIALOG_FIELDS: DemonstrationDialogFields = {
  name: "",
  effectiveDate: "",
  expirationDate: "",
  description: "",
  stateId: "",
  projectOfficerId: "",
};

const SUCCESS_MESSAGE = "Your demonstration is ready.";
const ERROR_MESSAGE = "Your demonstration was not created because of an unknown problem.";

export const CREATE_DEMONSTRATION_MUTATION = gql`
  mutation CreateDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      id
    }
  }
`;
export const CreateDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToast();

  const [createDemonstrationTrigger] = useMutation<{
    createDemonstration: Demonstration;
  }>(CREATE_DEMONSTRATION_MUTATION);

  const getCreateDemonstrationInput = (
    demonstration: DemonstrationDialogFields
  ): CreateDemonstrationInput => ({
    name: demonstration.name,
    description: demonstration.description,
    stateId: demonstration.stateId,
    projectOfficerUserId: demonstration.projectOfficerId,
    sdgDivision: demonstration.sdgDivision,
    signatureLevel: demonstration.signatureLevel,
  });

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      const result = await createDemonstrationTrigger({
        variables: {
          input: getCreateDemonstrationInput(demonstration),
        },
      });

      const success = !result.errors;
      onClose();
      if (success) {
        showSuccess(SUCCESS_MESSAGE);
      } else {
        console.error(result.errors);
        showError("Your demonstration was not created because of an unknown problem.");
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
