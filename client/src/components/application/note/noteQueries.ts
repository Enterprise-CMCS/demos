import { gql, useMutation } from "@apollo/client";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application";
import { SetApplicationNotesInput } from "demos-server";

const SET_APPLICATION_NOTES_MUTATION = gql`
  mutation SetApplicationNotes($input: SetApplicationNotesInput!) {
    setApplicationNotes(input: $input) {
      __typename
    }
  }
`;
export const useSetApplicationNotes = () => {
  const [mutate, { data, loading, error }] = useMutation(SET_APPLICATION_NOTES_MUTATION);

  const setApplicationNotes = async (input: SetApplicationNotesInput) => {
    return await mutate({
      variables: { input },
      refetchQueries: [
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ],
    });
  };

  return { setApplicationNotes, data, loading, error };
};
