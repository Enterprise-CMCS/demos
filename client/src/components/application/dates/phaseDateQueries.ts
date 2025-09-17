import { SetPhaseDateInput } from "demos-server";

// {
//   "bundleId": "5cb0286f-d770-4927-80c8-fb1c7864e21a",
//   "phase": "Concept",
//   "dateType": "Start Date",
//   "dateValue": "2025-08-30T23:59:59.999-04:00"
// }
export const getQueryForSetPhaseDate = (setPhaseDateInput: SetPhaseDateInput): string => {
  return `
    mutation SetPhaseDate {
      setPhaseDate(input: {
        bundleId: "${setPhaseDateInput.bundleId}",
        phase: ${setPhaseDateInput.phase},
        dateType: ${setPhaseDateInput.dateType},
        dateValue: "${setPhaseDateInput.dateValue}"
      }) {
        id
        name
      }
    }
  `;
};

/**
 * query Query($demonstrationId: ID!) {
  demonstration(id: $demonstrationId) {
    id
    name
    phases {
      phase
      phaseStatus
      phaseDates {
        dateType
        dateValue
      }
    }
  }
}
 */
