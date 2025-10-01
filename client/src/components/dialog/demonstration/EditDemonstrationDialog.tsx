import React from "react";
import { useToast } from "components/toast";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Demonstration,
  DemonstrationRoleAssignment,
  Person,
  UpdateDemonstrationInput,
} from "demos-server";
import { Loading } from "components/loading/Loading";

const SUCCESS_MESSAGE = "Demonstration updated successfully!";
const ERROR_MESSAGE = "Failed to update demonstration. Please try again.";

type PersonId = Pick<Person, "id">;
type DemonstrationRole = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & PersonId;
type ExistingDemonstration = Pick<
  Demonstration,
  | "id"
  | "name"
  | "description"
  | "cmcsDivision"
  | "signatureLevel"
  | "effectiveDate"
  | "expirationDate"
> & {
  state: Pick<Demonstration["state"], "id">;
  roles: DemonstrationRole[];
};

export const GET_EXISTING_DEMONSTRATION_QUERY = gql`
  query GetExistingDemonstration($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      cmcsDivision
      signatureLevel
      effectiveDate
      expirationDate
      state {
        id
      }
      roles {
        person {
          id
        }
        role
        isPrimary
      }
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
      }
    }
  }
`;

const getPrimaryProjectOfficerId = (roles: DemonstrationRole[]): string => {
  const projectOfficers = roles.filter((role) => role.role === "Project Officer");
  if (projectOfficers.length === 0) {
    throw new Error("No Project Officer found in roles");
  }

  const primaryProjectOfficer = projectOfficers.find((role) => role.isPrimary);
  if (!primaryProjectOfficer) {
    throw new Error("No primary Project Officer found in roles");
  }

  return primaryProjectOfficer.id;
};

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

const getInitialDemonstrationFields = (
  existingDemonstration: ExistingDemonstration
): DemonstrationDialogFields => ({
  name: existingDemonstration.name,
  description: existingDemonstration.description,
  projectOfficerId: getPrimaryProjectOfficerId(existingDemonstration.roles),
  effectiveDate: "",
  expirationDate: "",
  stateId: existingDemonstration.state.id,
});

export const EditDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  demonstrationId: string;
}> = ({ isOpen, demonstrationId, onClose }) => {
  const { showSuccess, showError } = useToast();

  const {
    data: existingDemonstration,
    loading: existingDemonstrationLoading,
    error: existingDemonstrationError,
  } = useQuery<{ demonstration: ExistingDemonstration }>(GET_EXISTING_DEMONSTRATION_QUERY, {
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

  if (existingDemonstrationLoading) {
    return <Loading />;
  }
  if (existingDemonstrationError) {
    return <div>Error loading demonstration data.</div>;
  }

  if (existingDemonstration) {
    return (
      <DemonstrationDialog
        isOpen={isOpen}
        onClose={onClose}
        mode="edit"
        onSubmit={onSubmit}
        initialDemonstration={getInitialDemonstrationFields(existingDemonstration.demonstration)}
      />
    );
  }
};
