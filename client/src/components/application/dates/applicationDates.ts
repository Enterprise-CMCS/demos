import { TZDate } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";

/**
 * Application Dates Library
 *
 * Reminder: The JS Date object simply wraps a number, the number of milliseconds since the epoch (Jan 1, 1970 midnight UTC).
 * In DEMOS we largely care about dates in EST timezone, centered around the CMS headquarters in that timezone.
 * (EST is UTC-5 or UTC-4 depending on daylight savings time.)
 *
 * In general when we talk about dates in the application, we are referring to dates in EST timezone.
 * The typing here attempts to make it clear when we are dealing with dates in EST timezone vs UTC.
 * as well as prevent function calls from accidentally passing in a date that is not in a date in the wrong timezone.
 */

type TimeZone = "America/New_York" | "UTC";
const EST_TIMEZONE: TimeZone = "America/New_York";

/**
 * Base date types.
 *
 * DateUTC: A date in UTC timezone - Used when the date is set by a user event
 * DateEST: A date in EST timezone - Used when the date is calculated for a deadline or beginning period
 * StartOfDayEST - A date in EST with timestamp @ 00:00:00.000 EST.
 * EndOfDayEST - A date in EST with timestamp @ 23:59:59.999 EST.
 *
 * This file uses branded types to prevent mixing up date types in function calls:
 * https://www.learningtypescript.com/articles/branded-types
 */
export type DateUTC = UTCDate & { readonly __utc: never };
export type DateEST = TZDate & { readonly __est: never };
export type StartOfDayEST = DateEST & { readonly __start: never };
export type EndOfDayEST = DateEST & { readonly __end: never };

export const getNowEst = (): DateEST => {
  return new TZDate(new Date(), EST_TIMEZONE) as DateEST;
};

export const getStartOfDayEST = (year: number, month: number, day: number): StartOfDayEST => {
  return new TZDate(year, month, day, 0, 0, 0, 0, EST_TIMEZONE) as StartOfDayEST;
};

export const getStartOfDateEST = (dateString: string): StartOfDayEST => {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  return getStartOfDayEST(parseInt(yearStr, 10), parseInt(monthStr, 10), parseInt(dayStr, 10));
};

export const getEndOfDayEST = (year: number, month: number, day: number): EndOfDayEST => {
  return new TZDate(year, month, day, 23, 59, 59, 999, EST_TIMEZONE) as EndOfDayEST;
};

export const getEndOfDateEST = (dateString: string): EndOfDayEST => {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  return getEndOfDayEST(parseInt(yearStr, 10), parseInt(monthStr, 10), parseInt(dayStr, 10));
};
