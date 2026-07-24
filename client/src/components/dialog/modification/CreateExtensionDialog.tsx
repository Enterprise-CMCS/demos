import React from "react";
import { gql, useMutation } from "@apollo/client";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";
import { ModificationFormData } from "./ModificationForm";
import { DEMONSTRATION_DETAIL_SHELL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATION_EXTENSIONS_QUERY } from "pages/DemonstrationDetail/modifications/modificationQueries";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      name
      createdAt
      demonstration {
        id
      }
    }
  }
`;

export const useCreateExtension = () => {
  const [createExtension, { loading }] = useMutation(CREATE_EXTENSION_MUTATION);

  const save = async (input: ModificationFormData) => {
    await createExtension({
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
          query: DEMONSTRATION_EXTENSIONS_QUERY,
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

export const CreateExtensionDialog: React.FC<{
  demonstrationId?: string;
}> = ({ demonstrationId }) => (
  <BaseCreateModificationDialog
    modificationType="Extension"
    useModification={useCreateExtension}
    demonstrationId={demonstrationId}
  />
);
