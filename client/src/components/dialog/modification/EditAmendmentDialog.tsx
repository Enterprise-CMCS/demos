import React from "react";
import { Modification, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { UpdateAmendmentInput } from "demos-server";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";
import { assertIsLocalDate } from "util/formatDate";

export const UPDATE_AMENDMENT_MUTATION: TypedDocumentNode<
  { updateAmendment: Modification },
  { id: string; input: UpdateAmendmentInput }
> = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectivePlainDate
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
      effectivePlainDate
      status
      signatureLevel
      demonstration {
        id
      }
    }
  }
`;

export const useUpdateAmendment = (amendmentId: string, refetchQueries: string[]) => {
  const { data, error } = useQuery(UPDATE_AMENDMENT_DIALOG_QUERY, {
    variables: { id: amendmentId },
  });
  const [updateAmendment, { loading }] = useMutation(UPDATE_AMENDMENT_MUTATION, {
    refetchQueries,
  });

  const save = async (input: ModificationFormData) => {
    const { effectiveDate, ...rest } = input;
    await updateAmendment({
      variables: {
        id: amendmentId,
        input: {
          ...rest,
          effectivePlainDate: effectiveDate ? assertIsLocalDate(effectiveDate) : null,
        },
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
  refetchQueries: string[];
}> = ({ amendmentId, refetchQueries }) => (
  <BaseEditModificationDialog
    modificationType="Amendment"
    useModification={() => useUpdateAmendment(amendmentId, refetchQueries)}
  />
);
