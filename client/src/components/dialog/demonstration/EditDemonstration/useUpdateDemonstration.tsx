import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { UpdateDemonstrationInput } from "demos-server";
import { useToast } from "components/toast";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

const UPDATE_SUCCESS_MESSAGE = "Your demonstration is ready.";
const UPDATE_ERROR_MESSAGE = "Your demonstration was not updated because of an unknown problem.";

export const UPDATE_DEMONSTRATION_MUTATION: TypedDocumentNode<
  {
    updateDemonstration: { id: string };
  },
  {
    id: string;
    input: UpdateDemonstrationInput;
  }
> = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
    }
  }
`;

export const useUpdateDemonstration = ({ onSuccess }: { onSuccess: () => void }) => {
  const { showSuccess, showError } = useToast();
  const [updateDemonstration, { loading }] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  const onSubmit = async (id: string, demonstration: UpdateDemonstrationInput) => {
    try {
      const { errors } = await updateDemonstration({
        variables: {
          id,
          input: demonstration,
        },
        refetchQueries: [DEMONSTRATIONS_PAGE_QUERY],
      });

      onSuccess();
      if (errors) {
        console.error(errors);
        showError(UPDATE_ERROR_MESSAGE);
        return;
      }

      showSuccess(UPDATE_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Update Demonstration failed:", error);
      showError(UPDATE_ERROR_MESSAGE);
    }
  };

  return {
    onSubmit,
    saving: loading,
  };
};
