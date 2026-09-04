import React from "react";
import { gql, useMutation } from "@apollo/client";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";
import { ModificationFormData } from "./ModificationForm";

export const CREATE_RENEWAL_MUTATION = gql`
  mutation CreateRenewal($input: CreateExtensionInput!) {
    createRenewal: createExtension(input: $input) {
      demonstration {
        id
        renewals: extensions {
          id
        }
      }
    }
  }
`;

export const useCreateRenewal = () => {
  const [createRenewal, { loading }] = useMutation(CREATE_RENEWAL_MUTATION);

  const save = async (input: ModificationFormData) => {
    await createRenewal({
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

export const CreateRenewalDialog: React.FC<{
  demonstrationId?: string;
}> = ({ demonstrationId }) => (
  <BaseCreateModificationDialog
    modificationType="Renewal"
    useModification={useCreateRenewal}
    demonstrationId={demonstrationId}
  />
);
