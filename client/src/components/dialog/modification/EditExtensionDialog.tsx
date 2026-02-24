import React from "react";
import { Modification, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { UpdateExtensionInput } from "demos-server";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";

export const UPDATE_EXTENSION_MUTATION: TypedDocumentNode<
  { updateExtension: Modification },
  { id: string; input: UpdateExtensionInput }
> = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

export const UPDATE_EXTENSION_DIALOG_QUERY: TypedDocumentNode<
  { extension: Modification },
  { id: string }
> = gql`
  query UpdateExtensionDialog($id: ID!) {
    extension(id: $id) {
      id
      name
      description
      effectiveDate
      signatureLevel
      demonstration {
        id
      }
    }
  }
`;

export const useUpdateExtension = (extensionId: string, refetchQueries: string[] = []) => {
  const { data, error } = useQuery(UPDATE_EXTENSION_DIALOG_QUERY, {
    variables: { id: extensionId },
  });
  const [updateExtension, { loading }] = useMutation(UPDATE_EXTENSION_MUTATION, {
    refetchQueries,
  });

  const save = async (input: ModificationFormData) => {
    await updateExtension({
      variables: {
        id: extensionId,
        input,
      },
    });
  };

  return {
    modification: data?.extension,
    error,
    save,
    saving: loading,
  };
};

export const UpdateExtensionDialog: React.FC<{
  extensionId: string;
  refetchQueries: string[];
}> = ({ extensionId, refetchQueries }) => (
  <BaseEditModificationDialog
    modificationType="Extension"
    useModification={() => useUpdateExtension(extensionId, refetchQueries)}
  />
);
