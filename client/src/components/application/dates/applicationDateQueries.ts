import { SetApplicationDateInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";

export const getQueryForSetApplicationDate = (
  setApplicationDateInput: SetApplicationDateInput
): string => {
  const isoDateString = formatDateAsIsoString(setApplicationDateInput.dateValue);
  return `
    mutation SetApplicationDate {
      setApplicationDate(input: {
        applicationId: "${setApplicationDateInput.applicationId}",
        dateType: ${setApplicationDateInput.dateType},
        dateValue: "${isoDateString}"
      })
    }
  `;
};
