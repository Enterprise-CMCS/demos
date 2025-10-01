import React from "react";

import { Loading } from "components/loading/Loading";
import { useToast } from "components/toast";
import { UpdateDemonstrationInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";

import { gql, useMutation, useQuery } from "@apollo/client";

import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";

const SUCCESS_MESSAGE = "Demonstration updated successfully!";
const ERROR_MESSAGE = "Failed to update demonstration. Please try again.";

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      sdgDivision
      signatureLevel
      state {
        id
      }
      roles {
        isPrimary
        role
        person {
          id
        }
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
      sdgDivision
      signatureLevel
      effectiveDate
      expirationDate
      state {
        id
        name
      }
    }
  }
`;

export const SET_DEMONSTRATION_ROLE_MUTATION = gql`
  mutation SetDemonstrationRole($input: SetDemonstrationRoleInput!) {
    setDemonstrationRole(input: $input) {
      demonstration {
        id
      }
      person {
        id
      }
      role
      isPrimary
    }
  }
`;

const getUpdateDemonstrationInput = (
  demonstration: DemonstrationDialogFields
): UpdateDemonstrationInput => ({
  name: demonstration.name,
  description: demonstration.description,
  stateId: demonstration.stateId,
  sdgDivision: demonstration.sdgDivision,
  signatureLevel: demonstration.signatureLevel,
  effectiveDate: demonstration.effectiveDate ? new Date(demonstration.effectiveDate) : undefined,
  expirationDate: demonstration.expirationDate ? new Date(demonstration.expirationDate) : undefined,
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
  const [setDemonstrationRoleTrigger] = useMutation(SET_DEMONSTRATION_ROLE_MUTATION);

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      const updateInput = getUpdateDemonstrationInput(demonstration);

      await updateDemonstrationTrigger({
        variables: {
          id: demonstrationId,
          input: updateInput,
        },
        refetchQueries: [
          {
            query: GET_DEMONSTRATION_BY_ID_QUERY,
            variables: { id: demonstrationId },
          },
          {
            query: DEMONSTRATION_DETAIL_QUERY,
            variables: { id: demonstrationId },
          },
        ],
      });

      const originalProjectOfficerId = (() => {
        const primaryProjectOfficer = data?.demonstration?.roles.find(
          (role: { role: string; isPrimary: boolean; person: { id: string } }) =>
            role.role === "Project Officer" && role.isPrimary === true
        );
        return primaryProjectOfficer?.person?.id || "";
      })();

      if (
        demonstration.projectOfficerId &&
        demonstration.projectOfficerId !== originalProjectOfficerId
      ) {
        await setDemonstrationRoleTrigger({
          variables: {
            input: {
              demonstrationId: demonstrationId,
              personId: demonstration.projectOfficerId,
              roleId: "Project Officer",
              isPrimary: true,
            },
          },
          refetchQueries: [
            {
              query: GET_DEMONSTRATION_BY_ID_QUERY,
              variables: { id: demonstrationId },
            },
            {
              query: DEMONSTRATION_DETAIL_QUERY,
              variables: { id: demonstrationId },
            },
          ],
        });
      }

      onClose();
      showSuccess(SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Update failed:", error);
      showError(ERROR_MESSAGE);
    }
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div>Error loading demonstration data.</div>;
  }

  const transformedDemonstration = data?.demonstration
    ? {
      ...data.demonstration,
      stateId: data.demonstration.state.id,
      projectOfficerId: (() => {
        const primaryProjectOfficer = data.demonstration.roles.find(
          (role: { role: string; isPrimary: boolean; person: { id: string } }) =>
            role.role === "Project Officer" && role.isPrimary === true
        );
        return primaryProjectOfficer?.person?.id || "";
      })(),
      effectiveDate: data.demonstration.effectiveDate
        ? data.demonstration.effectiveDate.split("T")[0]
        : "",
      expirationDate: data.demonstration.expirationDate
        ? data.demonstration.expirationDate.split("T")[0]
        : "",
    }
    : undefined;

  return (
    <DemonstrationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      onSubmit={onSubmit}
      initialDemonstration={transformedDemonstration}
    />
  );
};
