import React from "react";
import { useToast } from "components/toast";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { useMutation } from "@apollo/client";
import { CreateDemonstrationInput, Demonstration } from "demos-server";
import { gql } from "@apollo/client";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { getCurrentUser } from "components/user/UserContext";

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
  onClose: () => void;
}> = ({ onClose }) => {
  const { showSuccess, showError } = useToast();

  const [createDemonstrationTrigger] = useMutation<{
    createDemonstration: Demonstration;
  }>(CREATE_DEMONSTRATION_MUTATION);

  const userContext = getCurrentUser();
  if (!userContext) {
    throw new Error("Unable to identify current user. Please ensure that the user is logged in.");
  }

  const getCreateDemonstrationInput = (
    demonstration: DemonstrationDialogFields
  ): CreateDemonstrationInput => ({
    name: demonstration.name,
    description: demonstration.description,
    stateId: demonstration.stateId,
    projectOfficerUserId: demonstration.projectOfficerId,
    sdgDivision: demonstration.sdgDivision,
  });

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      const result = await createDemonstrationTrigger({
        variables: {
          input: getCreateDemonstrationInput(demonstration),
        },
        refetchQueries: [DEMONSTRATIONS_PAGE_QUERY],
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
      onClose={onClose}
      mode="create"
      initialDemonstration={{
        name: "",
        effectiveDate: "",
        expirationDate: "",
        description: "",
        stateId: "",
        projectOfficerId: userContext.currentUser.id,
      }}
      onSubmit={onSubmit}
    />
  );
};
