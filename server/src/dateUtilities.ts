import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "./constants.js";
import { DateTimeOrLocalDate, DateType, ExpectedTimestamp } from "./types.js";
import { TZDate } from "@date-fns/tz";

export type DateTimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
};

export function getDateTimeParts(dateValue: Date): DateTimeParts {
  return {
    hours: dateValue.getHours(),
    minutes: dateValue.getMinutes(),
    seconds: dateValue.getSeconds(),
    milliseconds: dateValue.getMilliseconds(),
  };
}

// This is intentionally structurally different to enable better type checking in TS
export type EasternTZDate = {
  readonly isEasternTZDate: true;
  easternTZDate: TZDate;
};

export function parseJSDateToEasternTZDate(input: Date): EasternTZDate {
  return { isEasternTZDate: true, easternTZDate: new TZDate(input, "America/New_York") };
}

export function parseDateTimeOrLocalDateToEasternTZDate(
  input: DateTimeOrLocalDate,
  expectedTimestamp: ExpectedTimestamp
): EasternTZDate {
  if (input instanceof Date) {
    return parseJSDateToEasternTZDate(input);
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
  const dateValue = new TZDate(
    origDateParts.year,
    origDateParts.month,
    origDateParts.day,
    origDateParts.hours,
    origDateParts.minutes,
    origDateParts.seconds,
    origDateParts.milliseconds,
    "America/New_York"
  );
  return { isEasternTZDate: true, easternTZDate: dateValue };
}

export function __getTodayStartOfDayEastern(): EasternTZDate {
  const easternNow: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(new Date(), "America/New_York"),
  };
  easternNow.easternTZDate.setHours(0, 0, 0, 0);
  return easternNow;
}

export function __getTodayEndOfDayEastern(): EasternTZDate {
  const easternNow: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(new Date(), "America/New_York"),
  };
  easternNow.easternTZDate.setHours(23, 59, 59, 999);
  return easternNow;
}

export type EasternNow = Record<ExpectedTimestamp, EasternTZDate>;
export function getEasternNow(): EasternNow {
  return {
    "Start of Day": __getTodayStartOfDayEastern(),
    "End of Day": __getTodayEndOfDayEastern(),
  };
}

export function getDayBoundaryLabel(dateType: DateType): ExpectedTimestamp {
  return DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[dateType].expectedTimestamp;
}
