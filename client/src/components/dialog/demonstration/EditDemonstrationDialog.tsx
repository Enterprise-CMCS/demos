import React from "react";

import { Loading } from "components/loading/Loading";
import { useToast } from "components/toast";
import { Demonstration, UpdateDemonstrationInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";

import { gql, useMutation, useQuery } from "@apollo/client";

import { DemonstrationData, DemonstrationDialog } from "./DemonstrationDialog";
import { endOfDay, parseISO } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { formatDateForServer } from "util/formatDate";

const SUCCESS_MESSAGE = "Your demonstration has been updated.";
const ERROR_MESSAGE = "Your demonstration was not updated because of an unknown problem.";

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
      primaryProjectOfficer {
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
      primaryProjectOfficer {
        id
      }
      effectiveDate
      expirationDate
    }
  }
`;

const getUpdateDemonstrationInput = (
  demonstration: DemonstrationData
): UpdateDemonstrationInput => {
  const input: Record<string, unknown> = {
    ...(demonstration.name && { name: demonstration.name }),
    ...(demonstration.stateId && { stateId: demonstration.stateId }),
    ...(demonstration.projectOfficerId && {
      projectOfficerUserId: demonstration.projectOfficerId,
    }),
  };

  if (demonstration.description && demonstration.description.trim() !== "") {
    input.description = demonstration.description;
  } else {
    input.description = null;
  }

  if (demonstration.effectiveDate && demonstration.effectiveDate.trim() !== "") {
    input.effectiveDate = parseISO(demonstration.effectiveDate);
  } else {
    input.effectiveDate = null;
  }

  if (demonstration.expirationDate && demonstration.expirationDate.trim() !== "") {
    input.expirationDate = endOfDay(new TZDate(demonstration.expirationDate, "America/New_York"));
  } else {
    input.expirationDate = null;
  }

  if (demonstration.sdgDivision) {
    input.sdgDivision = demonstration.sdgDivision;
  } else {
    input.sdgDivision = null;
  }

  if (demonstration.signatureLevel) {
    input.signatureLevel = demonstration.signatureLevel;
  } else {
    input.signatureLevel = null;
  }

  return input as UpdateDemonstrationInput;
};

const useUpdateDemonstration = () => {
  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  return async (demonstrationId: string, demonstrationDialogFields: DemonstrationData) => {
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

const getDemonstrationDialogFields = (demonstration: Demonstration): DemonstrationData => ({
  name: demonstration.name,
  description: demonstration.description,
  stateId: demonstration.state.id,
  projectOfficerId: demonstration.primaryProjectOfficer.id,
  sdgDivision: demonstration.sdgDivision,
  signatureLevel: demonstration.signatureLevel,
  effectiveDate: demonstration.effectiveDate
    ? formatDateForServer(demonstration.effectiveDate)
    : undefined,
  expirationDate: demonstration.expirationDate
    ? formatDateForServer(demonstration.expirationDate)
    : undefined,
});

export const EditDemonstrationDialog: React.FC<{
  demonstrationId: string;
}> = ({ demonstrationId }) => {
  const { showSuccess, showError } = useToast();
  const updateDemonstration = useUpdateDemonstration();

  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    GET_DEMONSTRATION_BY_ID_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );

  const onSubmit = async (demonstrationData: DemonstrationData) => {
    try {
      await updateDemonstration(demonstrationId, demonstrationData);

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
          mode="edit"
          onSubmit={onSubmit}
          initialDemonstrationData={getDemonstrationDialogFields(data.demonstration)}
        />
      )}
    </>
  );
};
