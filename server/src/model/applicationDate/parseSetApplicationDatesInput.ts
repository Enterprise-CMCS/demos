import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";
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
    if (applicationDate.dateValue === null) {
      result.applicationDatesToDelete.push(applicationDate.dateType);
    } else {
      result.applicationDatesToUpsert.push({
        dateType: applicationDate.dateType,
        dateValue: parseDateTimeOrLocalDateToEasternTZDate(
          applicationDate.dateValue,
          DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[applicationDate.dateType].expectedTimestamp
        ),
      });
    }
  }
  return result;
}
