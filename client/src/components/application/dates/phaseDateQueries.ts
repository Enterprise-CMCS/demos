import { SetPhaseDateInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";

export const getQueryForSetPhaseDate = (setPhaseDateInput: SetPhaseDateInput): string => {
  const isoDateString = formatDateAsIsoString(setPhaseDateInput.dateValue);
  return `
    mutation SetPhaseDate {
      setPhaseDate(input: {
        bundleId: "${setPhaseDateInput.bundleId}",
        phase: ${setPhaseDateInput.phase},
        dateType: ${setPhaseDateInput.dateType},
        dateValue: "${isoDateString}"
      })
    }
  `;
};
