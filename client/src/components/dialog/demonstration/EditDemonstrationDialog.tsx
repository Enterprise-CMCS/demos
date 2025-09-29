import React from "react";
import { useToast } from "components/toast";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { gql, useMutation, useQuery } from "@apollo/client";
import { UpdateDemonstrationInput } from "demos-server";
import { Loading } from "components/loading/Loading";

const SUCCESS_MESSAGE = "Demonstration updated successfully!";
const ERROR_MESSAGE = "Failed to update demonstration. Please try again.";

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      cmcsDivision
      signatureLevel
      state {
        id
      }
      projectOfficer {
        id
      }
      effectiveDate
      expirationDate
    }
  }
`;

export const UPDATE_DEMONSTRATION_MUTATION = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
    }
  }
`;

const getUpdateDemonstrationInput = (
  demonstration: DemonstrationDialogFields
): UpdateDemonstrationInput => ({
  name: demonstration.name,
  description: demonstration.description,
  stateId: demonstration.stateId,
  cmcsDivision: demonstration.cmcsDivision,
  signatureLevel: demonstration.signatureLevel,
  // effectiveDate: demonstration.effectiveDate,
  // expirationDate: demonstration.expirationDate,
});

export const EditDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  demonstrationId: string;
}> = ({ isOpen, demonstrationId, onClose }) => {
  const { showSuccess, showError } = useToast();

  const { data, loading, error } = useQuery(GET_DEMONSTRATION_BY_ID_QUERY, {
    variables: { id: demonstrationId },
  });
  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      await updateDemonstrationTrigger({
        variables: {
          id: demonstrationId,
          input: getUpdateDemonstrationInput(demonstration),
        },
      });
      onClose();
      showSuccess(SUCCESS_MESSAGE);
    } catch {
      showError(ERROR_MESSAGE);
    }
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>Error loading demonstration data.</div>;
  }

  return (
    <DemonstrationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      onSubmit={onSubmit}
      initialDemonstration={data?.demonstration}
    />
  );
};
