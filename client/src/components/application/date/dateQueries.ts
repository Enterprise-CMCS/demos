import type { SetApplicationDateInput, SetApplicationDatesInput } from "demos-server";
import { gql, useMutation } from "@apollo/client";

const SET_APPLICATION_DATE_MUTATION = gql`
  mutation SetApplicationDate($input: SetApplicationDateInput!) {
    setApplicationDate(input: $input) {
      ... on Demonstration {
        id
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
      ... on Amendment {
        id
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
      ... on Extension {
        id
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
    }
  }
`;

const SET_APPLICATION_DATES_MUTATION = gql`
  mutation SetApplicationDates($input: SetApplicationDatesInput!) {
    setApplicationDates(input: $input) {
      ... on Demonstration {
        id
        clearanceLevel
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
      ... on Amendment {
        id
        clearanceLevel
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
      ... on Extension {
        id
        clearanceLevel
        phases {
          phaseName
          phaseStatus
          phaseDates {
            dateType
            dateValue
          }
        }
      }
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
    });
  };

  return { setApplicationDate, data, loading, error };
};

/**
 * Hook to set multiple application dates with automatic refetching of the workflow demonstration.
 * Uses transaction handling to ensure all dates are set or none are set.
 *
 * @example
 * const { setApplicationDates } = useSetApplicationDates();
 *
 * await setApplicationDates({
 *   applicationId: "demo-123",
 *   applicationDates: [
 *     { dateType: "State Application Submitted Date", dateValue: "2024-01-15" },
 *     { dateType: "Concept Completion Date", dateValue: "2024-01-20" }
 *   ]
 * });
 */
export const useSetApplicationDates = () => {
  const [mutate, { data, loading, error }] = useMutation(SET_APPLICATION_DATES_MUTATION);

  const setApplicationDates = async (input: SetApplicationDatesInput) => {
    return await mutate({
      variables: { input },
    });
  };

  return { setApplicationDates, data, loading, error };
};
