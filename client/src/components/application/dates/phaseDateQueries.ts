import { SetPhaseDateInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";

export const getQueryForSetPhaseDate = (setPhaseDateInput: SetPhaseDateInput): string => {
  const isoDateString = formatDateAsIsoString(setPhaseDateInput.dateValue);
  return `
    mutation SetPhaseDate {
      setPhaseDate(input: {
        bundleId: "${setPhaseDateInput.bundleId}",
        phaseName: ${setPhaseDateInput.phaseName},
        dateType: ${setPhaseDateInput.dateType},
        dateValue: "${isoDateString}"
      })
    }
  `;
};
