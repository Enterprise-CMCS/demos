import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { parseLocalDateToEasternTZDate } from "../../dateUtilities.js";
import { SetApplicationDatesInput } from "../../types.js";
import { ParsedSetApplicationDatesInput } from ".";

export function parseSetApplicationDatesInput(
  inputApplicationDates: SetApplicationDatesInput
): ParsedSetApplicationDatesInput {
  const result: ParsedSetApplicationDatesInput = {
    applicationId: inputApplicationDates.applicationId,
    applicationDatesToUpsert: [],
    applicationDatesToDelete: [],
  };
  for (const applicationDate of inputApplicationDates.applicationDates) {
    if (applicationDate.plainDate === null) {
      result.applicationDatesToDelete.push(applicationDate.dateType);
    } else {
      result.applicationDatesToUpsert.push({
        dateType: applicationDate.dateType,
        dateValue: parseLocalDateToEasternTZDate(
          applicationDate.plainDate,
          DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[applicationDate.dateType].expectedTimestamp
        ),
      });
    }
  }
  return result;
}
