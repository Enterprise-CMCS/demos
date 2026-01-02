import { gql, useMutation } from "@apollo/client";
import { SetApplicationNotesInput } from "demos-server";
import { GET_APPLICATION_NOTES_QUERY } from "./RefetchQueriesDemonstration";

export const useSetApplicationNotes = () => {
  const [mutateDirectReturn] = useMutation(gql`
    mutation SetApplicationNotes($input: SetApplicationNotesInput!) {
      setApplicationNotes(input: $input) {
        ... on Demonstration {
          id
          phases {
            phaseName
            phaseNotes {
              noteType
              content
            }
          }
        }
      }
    }
  `);

  const [mutateWithRefetch] = useMutation(gql`
    mutation SetApplicationNotes($input: SetApplicationNotesInput!) {
      setApplicationNotes(input: $input) {
        __typename
      }
    }
  `);

  const setApplicationNotesDirectReturn = async (input: SetApplicationNotesInput) => {
    await mutateDirectReturn({
      variables: { input },
    });
  };

  const setApplicationNotesWithRefetch = async (input: SetApplicationNotesInput) => {
    await mutateWithRefetch({
      variables: { input },
      refetchQueries: [GET_APPLICATION_NOTES_QUERY],
    });
  };

  const setApplicationNotesWithAwaitedRefetch = async (input: SetApplicationNotesInput) => {
    await mutateWithRefetch({
      variables: { input },
      refetchQueries: [GET_APPLICATION_NOTES_QUERY],
      awaitRefetchQueries: true,
    });
  };

  return {
    setApplicationNotesDirectReturn,
    setApplicationNotesWithRefetch,
    setApplicationNotesWithAwaitedRefetch,
  };
};
