import type { SetApplicationDateInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "../ApplicationWorkflow";

const SET_APPLICATION_DATE_MUTATION = gql`
  mutation SetApplicationDate($input: SetApplicationDateInput!) {
    setApplicationDate(input: $input) {
      __typename
    }
  }
`;

/**
 * Hook to set application dates with automatic refetching of the workflow demonstration.
 *
 * @example
 * const { setApplicationDate } = useSetApplicationDate();
 *
 * await setApplicationDate({
 *   applicationId: "demo-123",
 *   dateType: "State Application Submitted Date",
 *   dateValue: "2024-01-15"
 * });
 */
export const useSetApplicationDate = () => {
  const [mutate, { data, loading, error }] = useMutation(SET_APPLICATION_DATE_MUTATION);

  const setApplicationDate = async (input: SetApplicationDateInput) => {
    return await mutate({
      variables: { input },
      refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY],
    });
  };

  return { setApplicationDate, data, loading, error };
};
