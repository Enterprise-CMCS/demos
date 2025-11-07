import { useMutation, gql } from "@apollo/client";
import { ApplicationDateInput, SetApplicationDatesInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

export const getQueryForSetApplicationDates = (
  setApplicationDatesInput: SetApplicationDatesInput
): string => {
  const properApplicationDateInputs = [];
  for (const applicationDate of setApplicationDatesInput.applicationDates) {
    properApplicationDateInputs.push({
      dateTypeId: applicationDate.dateType,
      dateValue: formatDateAsIsoString(applicationDate.dateValue),
    });
  }
  const applicationDatesQueryList = properApplicationDateInputs
    .map((record) => `{dateTypeId: "${record.dateTypeId}", dateValue: "${record.dateValue}"}`)
    .join(", ");
  return `
    mutation SetApplicationDate {
      setApplicationDate(input: {
        applicationId: "${setApplicationDatesInput.applicationId}",
        applicationDates: [${applicationDatesQueryList}]
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
  dateValues: Record<(typeof COMPLETENESS_PHASE_DATE_TYPES)[number], Date | null>
): SetApplicationDatesInput => {
  const applicationDateInputs: ApplicationDateInput[] = [];
  for (const dateTypeId of COMPLETENESS_PHASE_DATE_TYPES) {
    const dateValue = dateValues[dateTypeId];
    if (dateValue) {
      applicationDateInputs.push({
        dateType: dateTypeId,
        dateValue: dateValue,
      });
    }
  }
  return {
    applicationId: applicationId,
    applicationDates: applicationDateInputs,
  };
};

export const useSetApplicationDate = (input: SetApplicationDatesInput) => {
  const mutation = gql(getQueryForSetApplicationDates(input));

  const [mutate, { data, loading, error }] = useMutation(mutation);

  const setApplicationDate = async () => {
    return await mutate({ refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY] });
  };

  return { setApplicationDate, data, loading, error };
};
