import React from "react";
import { Modification, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { UpdateAmendmentInput } from "demos-server";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";

export const UPDATE_AMENDMENT_MUTATION: TypedDocumentNode<
  { updateAmendment: Modification },
  { id: string; input: UpdateAmendmentInput }
> = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

export const UPDATE_AMENDMENT_DIALOG_QUERY: TypedDocumentNode<
  { amendment: Modification },
  { id: string }
> = gql`
  query UpdateAmendmentDialog($id: ID!) {
    amendment(id: $id) {
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

export const useUpdateAmendment = (amendmentId: string) => {
  const { data, error } = useQuery(UPDATE_AMENDMENT_DIALOG_QUERY, {
    variables: { id: amendmentId },
  });
  const [updateAmendment, { loading }] = useMutation(UPDATE_AMENDMENT_MUTATION);

  const save = async (input: ModificationFormData) => {
    await updateAmendment({
      variables: {
        id: amendmentId,
        input,
      },
    });
  };

  return {
    modification: data?.amendment,
    error,
    save,
    saving: loading,
  };
};

export const UpdateAmendmentDialog: React.FC<{
  amendmentId: string;
}> = ({ amendmentId }) => (
  <BaseEditModificationDialog
    modificationType="Amendment"
    useModification={() => useUpdateAmendment(amendmentId)}
  />
);
