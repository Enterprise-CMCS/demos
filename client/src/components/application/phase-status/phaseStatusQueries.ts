import type { CompletePhaseInput, SetApplicationPhaseStatusInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "../ApplicationWorkflow";

export const getQueryForSetPhaseStatus = (
  setPhaseStatusInput: SetApplicationPhaseStatusInput
): string => {
  return `
    mutation SetPhaseStatus {
      setApplicationPhaseStatus(input: {
        applicationId: "${setPhaseStatusInput.applicationId}",
        phaseName: "${setPhaseStatusInput.phaseName}",
        phaseStatus: "${setPhaseStatusInput.phaseStatus}"
      }) { __typename }
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

const COMPLETE_PHASE_MUTATION = gql`
  mutation CompletePhase($input: CompletePhaseInput!) {
    completePhase(input: $input) {
      __typename
    }
  }
`;

export const useCompletePhase = () => {
  const [mutate, { data, loading, error }] = useMutation(COMPLETE_PHASE_MUTATION);

  const completePhase = async (input: CompletePhaseInput) => {
    return await mutate({ variables: { input }, refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY] });
  };

  return { completePhase, data, loading, error };
};
