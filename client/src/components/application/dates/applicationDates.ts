import { TZDate } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { formatDateTime } from "util/formatDate";

const ZERO = 0;
const END_OF_DAY_HOUR = 23;
const END_OF_DAY_MINUTE = 59;
const END_OF_DAY_MILLISECOND = 999;

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
 * DateUTC: A date in UTC timezone.
 * DateEST: A date in EST timezone.
 * StartDate: A date that marks the beginning of a phase. Timestamp should be SOD - 00:00:00 EST.
 * EndDate: A date that marks the end of a phase. Timestamp should be EOD - 23:59:59 EST.
 *
 * This system uses branded types to prevent mixing up date types in function calls:
 * https://www.learningtypescript.com/articles/branded-types
 */
export type DateUTC = UTCDate & { readonly __utc: never };
export type DateEST = TZDate & { readonly __est: never };
export type StartDate = DateEST & { readonly __start: never };
export type EndDate = DateEST & { readonly __end: never };

/**
 * Date Utility Functions
 *
 * These functions are used to convert between the types here:
 * Date, DateEST, StartDate and EndDate.
 * It is also to format dates correctly for the server
 *
 */
export const getESTDate = (date: Date): DateEST => {
  return new TZDate(date, EST_TIMEZONE) as DateEST;
};

export const getStartDate = (dateEst: DateEST): StartDate => {
  return new TZDate(
    dateEst.getFullYear(),
    dateEst.getMonth(),
    dateEst.getDate(),
    ZERO,
    ZERO,
    ZERO,
    EST_TIMEZONE
  ) as StartDate;
};

export const getEndDate = (dateEst: DateEST): EndDate => {
  return new TZDate(
    dateEst.getFullYear(),
    dateEst.getMonth(),
    dateEst.getDate(),
    END_OF_DAY_HOUR,
    END_OF_DAY_MINUTE,
    END_OF_DAY_MILLISECOND,
    EST_TIMEZONE
  ) as EndDate;
};

export const formatDateForServer = (date: Date): string => {
  // Format the date as needed for the server
  return formatDateTime(date);
};
