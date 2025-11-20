import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { parseDateTimeOrLocalDateToJSDate } from "../../dateUtilities.js";
import { ParsedSetApplicationDatesInput, SetApplicationDatesInput } from "../../types.js";

export function parseSetApplicationDatesInput(
  inputApplicationDates: SetApplicationDatesInput
): ParsedSetApplicationDatesInput {
  const result: ParsedSetApplicationDatesInput = {
    applicationId: inputApplicationDates.applicationId,
    applicationDates: [],
  };
  for (const applicationDate of inputApplicationDates.applicationDates) {
    result.applicationDates.push({
      dateType: applicationDate.dateType,
      dateValue: parseDateTimeOrLocalDateToJSDate(
        applicationDate.dateValue,
        DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[applicationDate.dateType].expectedTimestamp
      ),
    });
  }
  return result;
}
