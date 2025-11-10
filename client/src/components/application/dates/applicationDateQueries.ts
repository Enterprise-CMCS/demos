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

export const COMPLETENESS_PHASE_DATE_TYPES = [
  "State Application Deemed Complete",
  "Federal Comment Period Start Date",
  "Federal Comment Period End Date",
  "Completeness Completion Date",
] as const;

export const getInputsForCompletenessPhase = (
  applicationId: string,
  dateValues: Record<typeof COMPLETENESS_PHASE_DATE_TYPES[number], Date | null>
): SetApplicationDateInput[] => {
  return COMPLETENESS_PHASE_DATE_TYPES.reduce<SetApplicationDateInput[]>((inputs, dateType) => {
    const dateValue = dateValues[dateType];
    if (dateValue) {
      inputs.push({
        applicationId,
        dateType,
        dateValue,
      });
    }
    return inputs;
  }, []);
};

export const useSetApplicationDate = (input: SetApplicationDateInput) => {
  const mutation = gql(getQueryForSetApplicationDate(input));

  const [mutate, { data, loading, error }] = useMutation(mutation);

  const setApplicationDate = async () => {
    return await mutate({ refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY] });
  };

  return { setApplicationDate, data, loading, error };
};
