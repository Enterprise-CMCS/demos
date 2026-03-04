import type { CompletePhaseInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application";

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
    return await mutate({
      variables: { input },
      refetchQueries: [
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ],
    });
  };

  return { completePhase, data, loading, error };
};

const DECLARE_COMPLETENESS_PHASE_INCOMPLETE_MUTATION = gql`
  mutation DeclareCompletenessPhaseIncomplete($applicationId: ID!) {
    declareCompletenessPhaseIncomplete(applicationId: $applicationId) {
      __typename
    }
  }
`;

export const useDeclareCompletenessPhaseIncomplete = () => {
  const [mutate, { data, loading, error }] = useMutation(
    DECLARE_COMPLETENESS_PHASE_INCOMPLETE_MUTATION
  );

  const declareCompletenessPhaseIncomplete = async (applicationId: string) => {
    return await mutate({
      variables: { applicationId },
      refetchQueries: [
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ],
    });
  };

  return { declareCompletenessPhaseIncomplete, data, loading, error };
};

const SKIP_CONCEPT_PHASE_MUTATION = gql`
  mutation SkipConceptPhase($applicationId: ID!) {
    skipConceptPhase(applicationId: $applicationId) {
      __typename
    }
  }
`;

export const useSkipConceptPhase = () => {
  const [mutate, { data, loading, error }] = useMutation(SKIP_CONCEPT_PHASE_MUTATION);

  const skipConceptPhase = async (applicationId: string) => {
    console.log("skipConceptPhase called with applicationId:", applicationId);
    return await mutate({
      variables: { applicationId },
      refetchQueries: [
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ],
    });
  };

  return { skipConceptPhase, data, loading, error };
};
