import { format, parse } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { TZDate } from "@date-fns/tz";
import { LocalDate } from "demos-server";

type DateArgument = Date | string;

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const US_DATE_FORMAT = "MM/dd/yyyy";
export const EST_TIMEZONE = "America/New_York";

const isLocalDateString = (date: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(date);

const formatLocalDateStringForDisplay = (date: LocalDate): string =>
  format(parse(date, ISO_DATE_FORMAT, new UTCDate()), US_DATE_FORMAT);

export const formatDateForDisplay = (date: DateArgument): string => {
  if (typeof date === "string") {
    // LocalDate strings (yyyy-MM-dd) must be parsed in UTC to avoid timezone-induced off-by-one shifts.
    if (isLocalDateString(date)) {
      return formatLocalDateStringForDisplay(date as LocalDate);
    }
    // Full ISO datetime strings can be parsed directly by the Date constructor.
    return format(new Date(date), US_DATE_FORMAT);
  }
  // Date objects are formatted directly.
  return format(date, US_DATE_FORMAT);
};

/**
 * Formats a date to YYYY-MM-DD
 */
export const formatDateForServer = (date: DateArgument): LocalDate => {
  return format(date, ISO_DATE_FORMAT) as LocalDate;
};

/**
 * Gets today's date in Eastern Time in YYYY-MM-DD format
 */
export const getTodayEst = (): LocalDate => {
  const nowInET = new TZDate(Date.now(), EST_TIMEZONE);
  return formatDateForServer(nowInET);
};

/** Gets the provided date in Eastern Time in YYYY-MM-DD format */
export const getDateEst = (date: Date): LocalDate => {
  const dateInET = new TZDate(date, EST_TIMEZONE);
  return formatDateForServer(dateInET);
};
