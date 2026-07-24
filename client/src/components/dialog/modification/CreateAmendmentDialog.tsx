import React from "react";
import { gql, useMutation } from "@apollo/client";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";
import { ModificationFormData } from "./ModificationForm";
import { DEMONSTRATION_DETAIL_SHELL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATION_AMENDMENTS_QUERY } from "pages/DemonstrationDetail/modifications/modificationQueries";

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      name
      createdAt
      demonstration {
        id
      }
    }
  }
`;

export const useCreateAmendment = () => {
  const [createAmendment, { loading }] = useMutation(CREATE_AMENDMENT_MUTATION);

  const save = async (input: ModificationFormData) => {
    await createAmendment({
      variables: {
        input: {
          demonstrationId: input.demonstrationId,
          name: input.name,
          description: input.description,
          signatureLevel: input.signatureLevel,
        },
      },
      refetchQueries: [
        {
          query: DEMONSTRATION_DETAIL_SHELL_QUERY,
          variables: { id: input.demonstrationId },
        },
        {
          query: DEMONSTRATION_AMENDMENTS_QUERY,
          variables: { id: input.demonstrationId },
        },
      ],
    });
  };

  return {
    save,
    saving: loading,
  };
};

export const CreateAmendmentDialog: React.FC<{
  demonstrationId?: string;
}> = ({ demonstrationId }) => (
  <BaseCreateModificationDialog
    modificationType="Amendment"
    useModification={useCreateAmendment}
    demonstrationId={demonstrationId}
  />
);
