import { TZDate } from "@date-fns/tz";
import { checkInputDateIsStartOfDay, checkInputDateIsEndOfDay } from "./checkInputDateFunctions.js";
import { parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";
import { DateTimeOrLocalDate } from "../../types.js";

// Types for the specific case when we know both inputs are present
type GuaranteedDateInput = {
  effectiveDate: DateTimeOrLocalDate;
  expirationDate: DateTimeOrLocalDate;
};

type GuaranteedDateOutput = {
  effectiveDate: TZDate;
  expirationDate: TZDate;
};

type DateInput = {
  effectiveDate?: DateTimeOrLocalDate | null;
  expirationDate?: DateTimeOrLocalDate | null;
};

type DateOutput = {
  effectiveDate?: TZDate | null;
  expirationDate?: TZDate | null;
};

// Making returns and types very explicit even if subtyping would allow otherwise
export function parseAndValidateEffectiveAndExpirationDates(
  input: GuaranteedDateInput
): GuaranteedDateOutput;

export function parseAndValidateEffectiveAndExpirationDates(input: DateInput): DateOutput;

export function parseAndValidateEffectiveAndExpirationDates(
  input: DateInput | GuaranteedDateInput
): DateOutput | GuaranteedDateOutput {
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
