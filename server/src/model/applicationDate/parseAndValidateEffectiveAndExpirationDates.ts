import { TZDate } from "@date-fns/tz";
import { checkInputDateIsStartOfDay, checkInputDateIsEndOfDay } from "./checkInputDateFunctions.js";
import { parseLocalDateToEasternTZDate } from "../../dateUtilities.js";

// Types for the specific case when we know both inputs are present
type GuaranteedDateInput = {
  effectivePlainDate: string;
  expirationPlainDate: string;
};

type GuaranteedDateOutput = {
  effectiveDate: TZDate;
  expirationDate: TZDate;
};

type DateInput = {
  effectivePlainDate?: string | null;
  expirationPlainDate?: string | null;
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

  if (input.effectivePlainDate) {
    const parsed = parseLocalDateToEasternTZDate(input.effectivePlainDate, "Start of Day");
    checkInputDateIsStartOfDay("effectiveDate", parsed);
    effectiveDate = parsed.easternTZDate;
  } else if (input.effectivePlainDate === null) {
    effectiveDate = null;
  }

  if (input.expirationPlainDate) {
    const parsed = parseLocalDateToEasternTZDate(input.expirationPlainDate, "End of Day");
    checkInputDateIsEndOfDay("expirationDate", parsed);
    expirationDate = parsed.easternTZDate;
  } else if (input.expirationPlainDate === null) {
    expirationDate = null;
  }

  return {
    ...(effectiveDate !== undefined && { effectiveDate }),
    ...(expirationDate !== undefined && { expirationDate }),
  };
}
