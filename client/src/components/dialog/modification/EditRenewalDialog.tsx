import React from "react";
import { Modification, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { UpdateExtensionInput } from "demos-server";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";
import { assertIsLocalDate } from "util/formatDate";

export const UPDATE_RENEWAL_MUTATION: TypedDocumentNode<
  { updateRenewal: Modification },
  { id: string; input: UpdateExtensionInput }
> = gql`
  mutation UpdateRenewal($id: ID!, $input: UpdateExtensionInput!) {
    updateRenewal: updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectivePlainDate
      signatureLevel
    }
  }
`;

export const UPDATE_RENEWAL_DIALOG_QUERY: TypedDocumentNode<
  { renewal: Modification },
  { id: string }
> = gql`
  query UpdateRenewalDialog($id: ID!) {
    renewal: extension(id: $id) {
      id
      name
      description
      effectivePlainDate
      signatureLevel
      status
      demonstration {
        id
      }
    }
  }
`;

export const useUpdateRenewal = (renewalId: string, refetchQueries: string[] = []) => {
  const { data, error } = useQuery(UPDATE_RENEWAL_DIALOG_QUERY, {
    variables: { id: renewalId },
  });
  const [updateRenewal, { loading }] = useMutation(UPDATE_RENEWAL_MUTATION, {
    refetchQueries,
  });

  const save = async (input: ModificationFormData) => {
    const { effectiveDate, ...rest } = input;
    await updateRenewal({
      variables: {
        id: renewalId,
        input: {
          ...rest,
          effectivePlainDate: effectiveDate ? assertIsLocalDate(effectiveDate) : null,
        },
      },
    });
  };

  return {
    modification: data?.renewal,
    error,
    save,
    saving: loading,
  };
};

export const UpdateRenewalDialog: React.FC<{
  renewalId: string;
  refetchQueries: string[];
}> = ({ renewalId, refetchQueries }) => (
  <BaseEditModificationDialog
    modificationType="Renewal"
    useModification={() => useUpdateRenewal(renewalId, refetchQueries)}
  />
);
