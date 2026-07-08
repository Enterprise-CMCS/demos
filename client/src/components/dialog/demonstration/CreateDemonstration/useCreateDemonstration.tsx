import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { CreateDemonstrationInput } from "demos-server";
import { useToast } from "components/toast";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

const CREATE_SUCCESS_MESSAGE = "Your demonstration is ready.";
const CREATE_ERROR_MESSAGE = "Your demonstration was not created because of an unknown problem.";

export const CREATE_DEMONSTRATION_MUTATION: TypedDocumentNode<
  {
    createDemonstration: { id: string };
  },
  {
    input: CreateDemonstrationInput;
  }
> = gql`
  mutation CreateDemonstration($input: CreateDemonstrationInput!) {
    createDemonstration(input: $input) {
      id
    }
  }
`;

export const useCreateDemonstration = ({ onSuccess }: { onSuccess: () => void }) => {
  const { showSuccess, showError } = useToast();
  const [createDemonstration, { loading }] = useMutation(CREATE_DEMONSTRATION_MUTATION);

  const onSubmit = async (demonstration: CreateDemonstrationInput) => {
    try {
      const { errors } = await createDemonstration({
        variables: {
          input: demonstration,
        },
        refetchQueries: [DEMONSTRATIONS_PAGE_QUERY],
      });

      onSuccess();
      if (errors) {
        console.error(errors);
        showError(CREATE_ERROR_MESSAGE);
        return;
      }

      showSuccess(CREATE_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Create Demonstration failed:", error);
      showError(CREATE_ERROR_MESSAGE);
    }
  };

  return {
    onSubmit,
    saving: loading,
  };
};
