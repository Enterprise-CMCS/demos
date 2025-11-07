import { DateTimeOrLocalDate, ExpectedTimestamp } from "./types.js";
import { TZDate } from "@date-fns/tz";

export function parseInputToDate(
  input: DateTimeOrLocalDate,
  expectedTimestamp: ExpectedTimestamp
): Date {
  if (input instanceof Date) {
    return input;
  }
  // When created, the assumed timezone is UTC
  // This is why getUTC* functions are used below
  const origDate = new Date(input);
  const origDateParts = {
    year: origDate.getUTCFullYear(),
    month: origDate.getUTCMonth(),
    day: origDate.getUTCDate(),
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  };
  if (expectedTimestamp === "End of Day") {
    origDateParts.hours = 23;
    origDateParts.minutes = 59;
    origDateParts.seconds = 59;
    origDateParts.milliseconds = 999;
  }
  const dateValue = new Date(
    new TZDate(
      origDateParts.year,
      origDateParts.month,
      origDateParts.day,
      origDateParts.hours,
      origDateParts.minutes,
      origDateParts.seconds,
      origDateParts.milliseconds,
      "America/New_York"
    )
  );
  return dateValue;
}
