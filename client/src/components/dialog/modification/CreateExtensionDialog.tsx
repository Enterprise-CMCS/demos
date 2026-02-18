import React from "react";
import { gql, useMutation } from "@apollo/client";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";
import { ModificationFormData } from "./ModificationForm";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      demonstration {
        id
        extensions {
          id
        }
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
