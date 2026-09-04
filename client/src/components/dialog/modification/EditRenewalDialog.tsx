import React from "react";
import { Modification, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { DateTimeOrLocalDate, UpdateExtensionInput } from "demos-server";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";

export const UPDATE_RENEWAL_MUTATION: TypedDocumentNode<
  { updateRenewal: Modification },
  { id: string; input: UpdateExtensionInput }
> = gql`
  mutation UpdateRenewal($id: ID!, $input: UpdateExtensionInput!) {
    updateRenewal: updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
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
      effectiveDate
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
    await updateRenewal({
      variables: {
        id: renewalId,
        input: {
          ...input,
          effectiveDate: input.effectiveDate as DateTimeOrLocalDate | null | undefined,
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
