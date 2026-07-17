import React from "react";

import { Loading } from "components/loading/Loading";
import { useToast } from "components/toast";
import {
  Demonstration as ServerDemonstration,
  LocalDate,
  UpdateDemonstrationInput,
  State as ServerState,
  Person as ServerPerson,
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
} from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { formatDateForServer } from "util/formatDate";

import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";

import { DemonstrationDialog, DemonstrationDialogFields } from "./DemonstrationDialog";

const SUCCESS_MESSAGE = "Your demonstration has been updated.";
const ERROR_MESSAGE = "Your demonstration was not updated because of an unknown problem.";

type Demonstration = Pick<
  ServerDemonstration,
  | "id"
  | "name"
  | "description"
  | "status"
  | "sdgDivision"
  | "signatureLevel"
  | "effectiveDate"
  | "expirationDate"
> & {
  state: Pick<ServerState, "id">;
  primaryProjectOfficer: Pick<ServerPerson, "id">;
};

export const GET_DEMONSTRATION_BY_ID_QUERY: TypedDocumentNode<
  {
    demonstration: Demonstration;
  },
  {
    id: string;
  }
> = gql`
  query EditDemonstrationDialog($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      status
      sdgDivision
      signatureLevel
      effectiveDate
      expirationDate
      state {
        id
      }
      primaryProjectOfficer {
        id
      }
    }
  }
`;

export const UPDATE_DEMONSTRATION_MUTATION: TypedDocumentNode<
  {
    demonstration: Demonstration & {
      roles: (Pick<ServerDemonstrationRoleAssignment, "isPrimary" | "role"> & {
        person: Pick<ServerPerson, "id">;
      })[];
    };
  },
  {
    id: string;
    input: UpdateDemonstrationInput;
  }
> = gql`
  mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
    updateDemonstration(id: $id, input: $input) {
      id
      name
      description
      status
      sdgDivision
      signatureLevel
      effectiveDate
      expirationDate
      state {
        id
      }
      primaryProjectOfficer {
        id
      }
      roles {
        isPrimary
        role
        person {
          id
        }
      }
    }
  }
`;

export const getUpdateDemonstrationInput = (
  demonstration: DemonstrationDialogFields
): UpdateDemonstrationInput => {
  return {
    ...(demonstration.name && { name: demonstration.name }),
    ...(demonstration.projectOfficerId && {
      projectOfficerUserId: demonstration.projectOfficerId,
    }),
    description: demonstration.description?.trim(),
    effectiveDate: (demonstration.effectiveDate as LocalDate) || null,
    expirationDate: (demonstration.expirationDate as LocalDate) || null,
    sdgDivision: demonstration.sdgDivision || null,
  };
};

const getDemonstrationDialogFields = (demonstration: Demonstration): DemonstrationDialogFields => ({
  name: demonstration.name,
  description: demonstration.description || "",
  stateId: demonstration.state.id,
  projectOfficerId: demonstration.primaryProjectOfficer.id,
  ...(demonstration.sdgDivision && { sdgDivision: demonstration.sdgDivision }),
  ...(demonstration.signatureLevel && { signatureLevel: demonstration.signatureLevel }),
  effectiveDate: demonstration.effectiveDate
    ? formatDateForServer(demonstration.effectiveDate)
    : "",
  expirationDate: demonstration.expirationDate
    ? formatDateForServer(demonstration.expirationDate)
    : "",
});

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

export const EditDemonstrationDialog: React.FC<{
  onClose: () => void;
  demonstrationId: string;
}> = ({ demonstrationId, onClose }) => {
  const { showSuccess, showError } = useToast();
  const updateDemonstration = useUpdateDemonstration();

  const { data, loading, error } = useQuery(GET_DEMONSTRATION_BY_ID_QUERY, {
    variables: { id: demonstrationId },
  });

  const onSubmit = async (demonstrationDialogFields: DemonstrationDialogFields) => {
    try {
      await updateDemonstration(demonstrationId, demonstrationDialogFields);

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
          onClose={onClose}
          mode="edit"
          isApproved={data.demonstration.status === "Approved"}
          onSubmit={onSubmit}
          initialDemonstration={getDemonstrationDialogFields(data.demonstration)}
        />
      )}
    </>
  );
};
