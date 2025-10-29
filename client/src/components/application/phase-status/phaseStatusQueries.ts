import type { SetApplicationPhaseStatusInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "../ApplicationWorkflow";

export const getQueryForSetPhaseStatus = (
  setPhaseStatusInput: SetApplicationPhaseStatusInput
): string => {
  return `
    mutation SetPhaseStatus {
      setPhaseStatus(input: {
        applicationId: "${setPhaseStatusInput.applicationId}",
        phaseName: "${setPhaseStatusInput.phaseName}",
        phaseStatus: "${setPhaseStatusInput.phaseStatus}"
      })
    }
  `;
};

export const useSetPhaseStatus = (input: SetApplicationPhaseStatusInput) => {
  const mutation = gql(getQueryForSetPhaseStatus(input));

  const [mutate, { data, loading, error }] = useMutation(mutation);

  const setPhaseStatus = async () => {
    return await mutate({ refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY] });
  };

  return { setPhaseStatus, data, loading, error };
};
