import { useMutation, gql } from "@apollo/client";
import { SetApplicationDateInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

export const getQueryForSetApplicationDate = (
  setApplicationDateInput: SetApplicationDateInput
): string => {
  const isoDateString = formatDateAsIsoString(setApplicationDateInput.dateValue);
  return `
    mutation SetApplicationDate {
      setApplicationDate(input: {
        applicationId: "${setApplicationDateInput.applicationId}",
        dateType: "${setApplicationDateInput.dateType}",
        dateValue: "${isoDateString}"
      }) { __typename }
    }
  `;
};

export const useSetApplicationDate = (input: SetApplicationDateInput) => {
  const mutation = gql(getQueryForSetApplicationDate(input));

  const [mutate, { data, loading, error }] = useMutation(mutation);

  const setApplicationDate = async () => {
    return await mutate({ refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY] });
  };

  return { setApplicationDate, data, loading, error };
};
