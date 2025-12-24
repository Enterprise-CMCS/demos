import type { SetApplicationClearanceLevelInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "../ApplicationWorkflow";

const SET_APPLICATION_CLEARANCE_LEVEL = gql`
  mutation SetApplicationClearanceLevel($input: SetApplicationClearanceLevel!) {
    SetApplicationClearanceLevel(input: $input) {
      __typename
    }
  }
`;

export const useSetApplicationClearanceLevel = () => {
  const [mutate, { data, loading, error }] = useMutation(SET_APPLICATION_CLEARANCE_LEVEL);

  const setApplicationClearanceLevel = async (input: SetApplicationClearanceLevelInput) => {
    return await mutate({
      variables: { input },
      refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY],
    });
  };

  return { setApplicationClearanceLevel, data, loading, error };
};
