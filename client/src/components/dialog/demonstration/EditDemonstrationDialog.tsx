import React from "react";

import { Loading } from "components/loading/Loading";
import { useToast } from "components/toast";
import { Demonstration, UpdateDemonstrationInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { gql, useMutation, useQuery } from "@apollo/client";
import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";
import { formatDateForServer, parseInputDate } from "util/formatDate";

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
  ...(demonstration.name && { name: demonstration.name }),
  ...(demonstration.description && { description: demonstration.description }),
  ...(demonstration.stateId && { stateId: demonstration.stateId }),
  ...(demonstration.sdgDivision && { sdgDivision: demonstration.sdgDivision }),
  ...(demonstration.signatureLevel && { signatureLevel: demonstration.signatureLevel }),
  ...(demonstration.effectiveDate && {
    effectiveDate: parseInputDate(demonstration.effectiveDate),
  }),
  ...(demonstration.expirationDate && {
    expirationDate: parseInputDate(demonstration.expirationDate),
  }),
});

const getDemonstrationDialogFields = (demonstration: Demonstration): DemonstrationDialogFields => ({
  name: demonstration.name,
  description: demonstration.description || "",
  ...(demonstration.sdgDivision && { sdgDivision: demonstration.sdgDivision }),
  ...(demonstration.signatureLevel && { signatureLevel: demonstration.signatureLevel }),
  stateId: demonstration.state.id,
  projectOfficerId: getProjectOfficerId(demonstration),
  effectiveDate: demonstration.effectiveDate
    ? formatDateForServer(demonstration.effectiveDate)
    : "",
  expirationDate: demonstration.expirationDate
    ? formatDateForServer(demonstration.expirationDate)
    : "",
});

const getProjectOfficerId = (demonstration: Demonstration): string => {
  const primaryProjectOfficer = demonstration.roles.find(
    (role) => role.role === "Project Officer" && role.isPrimary === true
  );

  if (!primaryProjectOfficer) {
    throw new Error("No primary project officer found for the demonstration.");
  }

  return primaryProjectOfficer.person.id;
};

const useUpdateDemonstration = () => {
  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  return async (demonstrationId: string, demonstrationDialogFields: DemonstrationDialogFields) => {
    const updateInput = getUpdateDemonstrationInput(demonstrationDialogFields);

    await updateDemonstrationTrigger({
      variables: {
        id: demonstrationId,
        input: updateInput,
      },
      refetchQueries: [
        {
          query: DEMONSTRATION_DETAIL_QUERY,
          variables: { id: demonstrationId },
        },
      ],
    });
  };
};

const useUpdateProjectOfficer = () => {
  const [setDemonstrationRoleTrigger] = useMutation(SET_DEMONSTRATION_ROLE_MUTATION);

  return async (
    demonstrationId: string,
    originalProjectOfficerId: string,
    demonstrationDialogFields: DemonstrationDialogFields
  ) => {
    // Guard: if the project officer hasn't changed, do nothing
    if (originalProjectOfficerId == demonstrationDialogFields.projectOfficerId) {
      return;
    }
    await setDemonstrationRoleTrigger({
      variables: {
        input: {
          demonstrationId: demonstrationId,
          personId: demonstrationDialogFields.projectOfficerId,
          roleId: "Project Officer",
          isPrimary: true,
        },
      },
      refetchQueries: [
        {
          query: DEMONSTRATION_DETAIL_QUERY,
          variables: { id: demonstrationId },
        },
      ],
    });
  };
};

export const EditDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  demonstrationId: string;
}> = ({ isOpen, demonstrationId, onClose }) => {
  const { showSuccess, showError } = useToast();
  const updateDemonstration = useUpdateDemonstration();
  const updateProjectOfficer = useUpdateProjectOfficer();

  const { data, loading, error } = useQuery(GET_DEMONSTRATION_BY_ID_QUERY, {
    variables: { id: demonstrationId },
  });

  const onSubmit = async (demonstrationDialogFields: DemonstrationDialogFields) => {
    try {
      await updateDemonstration(demonstrationId, demonstrationDialogFields);
      await updateProjectOfficer(
        demonstrationId,
        getProjectOfficerId(data.demonstration),
        demonstrationDialogFields
      );

      onClose();
      showSuccess(SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Edit Demonstration failed:", error);
      showError(ERROR_MESSAGE);
    }
  };

  return (
    <>
      {loading && <Loading />}
      {error && <div>Error loading demonstration data.</div>}
      {data && (
        <DemonstrationDialog
          isOpen={isOpen}
          onClose={onClose}
          mode="edit"
          onSubmit={onSubmit}
          initialDemonstration={getDemonstrationDialogFields(data.demonstration)}
        />
      )}
    </>
  );
};
