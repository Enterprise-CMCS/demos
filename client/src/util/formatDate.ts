import { format, parse } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { TZDate } from "@date-fns/tz";
import { LocalDate } from "demos-server";

type DateArgument = Date | string;

const ISO_DATE_FORMAT = "yyyy-MM-dd";
const US_DATE_FORMAT = "MM/dd/yyyy";
export const EST_TIMEZONE = "America/New_York";

/**
 * Formats a date to MM/DD/YYYY.
 * When passed a LocalDate string (yyyy-MM-dd), parses it in UTC to avoid
 * timezone-induced off-by-one shifts.
 */
export const formatDateForDisplay = (date: DateArgument): string => {
  // If the input is a string, check if it's a LocalDate (yyyy-MM-dd) and parse it as UTC to
  // avoid timezone-induced off-by-one shifts. Otherwise, parse it as a full datetime.
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return format(parse(date, ISO_DATE_FORMAT, new UTCDate()), US_DATE_FORMAT);
    }
    return format(new Date(date), US_DATE_FORMAT);
  }
  // Otherwise it's a date and we format it directly.
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
