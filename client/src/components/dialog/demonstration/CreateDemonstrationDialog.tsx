import React from "react";
import { useToast } from "components/toast";
import { DemonstrationData, DemonstrationDialog } from "./DemonstrationDialog";
import { useMutation } from "@apollo/client";
import { Demonstration } from "demos-server";
import { gql } from "@apollo/client";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

const SUCCESS_MESSAGE = "Your demonstration is ready.";
const ERROR_MESSAGE = "Your demonstration was not created because of an unknown problem.";

export const CREATE_DEMONSTRATION_MUTATION = gql`
  mutation CreateDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      id
    }
  }
`;
export const CreateDemonstrationDialog: React.FC = () => {
  const { showSuccess, showError } = useToast();

  const [createDemonstrationTrigger] = useMutation<{
    createDemonstration: Demonstration;
  }>(CREATE_DEMONSTRATION_MUTATION);

  const onSubmit = async (demonstrationData: DemonstrationData) => {
    try {
      const result = await createDemonstrationTrigger({
        variables: {
          input: demonstrationData,
        },
        refetchQueries: [DEMONSTRATIONS_PAGE_QUERY],
      });

      const success = !result.errors;
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
      mode="create"
      onSubmit={onSubmit}
    />
  );
};
