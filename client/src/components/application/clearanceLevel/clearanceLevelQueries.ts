import { gql, useMutation } from "@apollo/client";
import { ClearanceLevel } from "demos-server";

// Simplified: Only query __typename since we don't use the return value
const UPDATE_APPLICATION_CLEARANCE_LEVEL = gql`
  mutation UpdateApplicationClearanceLevel($input: UpdateApplicationClearanceLevelInput!) {
    updateApplicationClearanceLevel(input: $input) {
      __typename
    }
  }
`;

export interface UpdateApplicationClearanceLevelInput {
  applicationId: string;
  clearanceLevel: ClearanceLevel;
}

export const useUpdateApplicationClearanceLevel = () => {
  const [updateApplicationClearanceLevelMutation] = useMutation(UPDATE_APPLICATION_CLEARANCE_LEVEL);

  const updateApplicationClearanceLevel = async (input: UpdateApplicationClearanceLevelInput) => {
    await updateApplicationClearanceLevelMutation({
      variables: { input },
    });
  };

  return { updateApplicationClearanceLevel };
};
