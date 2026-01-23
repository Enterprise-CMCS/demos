import { TZDate } from "@date-fns/tz";
import { checkInputDateIsStartOfDay, checkInputDateIsEndOfDay } from "./checkInputDateFunctions.js";
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";
import { DateTimeOrLocalDate } from "../../types.js";

type DateInput = {
  effectiveDate?: DateTimeOrLocalDate | null;
  expirationDate?: DateTimeOrLocalDate | null;
};

export function parseAndValidateEffectiveAndExpirationDates(input: DateInput): {
  effectiveDate?: TZDate | null;
  expirationDate?: TZDate | null;
} {
  let effectiveDate: TZDate | null | undefined;
  let expirationDate: TZDate | null | undefined;

  if (input.effectiveDate) {
    const parsed = parseDateTimeOrLocalDateToEasternTZDate(input.effectiveDate, "Start of Day");
    checkInputDateIsStartOfDay("effectiveDate", parsed);
    effectiveDate = parsed.easternTZDate;
  } else if (input.effectiveDate === null) {
    effectiveDate = null;
  }

  if (input.expirationDate) {
    const parsed = parseDateTimeOrLocalDateToEasternTZDate(input.expirationDate, "End of Day");
    checkInputDateIsEndOfDay("expirationDate", parsed);
    expirationDate = parsed.easternTZDate;
  } else if (input.expirationDate === null) {
    expirationDate = null;
  }

  return {
    ...(effectiveDate !== undefined && { effectiveDate }),
    ...(expirationDate !== undefined && { expirationDate }),
  };
}
