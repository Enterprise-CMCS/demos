import { gql, useMutation } from "@apollo/client";
import { SetApplicationNotesInput } from "demos-server";

const SET_APPLICATION_NOTES_MUTATION = gql`
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
      ... on Amendment {
        id
        phases {
          phaseName
          phaseNotes {
            noteType
            content
          }
        }
      }
      ... on Extension {
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
`;
export const useSetApplicationNotes = () => {
  const [mutate, { data, loading, error }] = useMutation(SET_APPLICATION_NOTES_MUTATION);

  const setApplicationNotes = async (input: SetApplicationNotesInput) => {
    return await mutate({
      variables: { input },
    });
  };

  return { setApplicationNotes, data, loading, error };
};
